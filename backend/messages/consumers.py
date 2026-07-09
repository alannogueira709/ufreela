import html
import json
import logging
from urllib.parse import urlparse

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .models import Conversation, Message

logger = logging.getLogger("django")

# Limite de caracteres por mensagem para mitigar flood e payloads enormes.
MAX_MESSAGE_LENGTH = 2000

# Rate limiting: maximo de mensagens por usuario em uma janela de tempo.
MAX_MESSAGES_PER_WINDOW = 60
RATE_LIMIT_WINDOW_SECONDS = 60


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        # Valida a origem antes de aceitar a conexao.
        if not self._validate_origin():
            logger.warning("CHAT: Origem invalida. Fechando conexao.")
            await self.close()
            return

        # Autenticacao apenas via cookie HttpOnly. Token na query string eh
        # proibido porque fica exposto em logs de proxies e historico de
        # navegadores.
        token = ""
        if "cookies" in self.scope:
            token = self.scope["cookies"].get("access_token", "")

        self.user = await self.get_user_from_token(token)
        logger.debug(f"DEBUG CHAT: User extracted from token: {self.user}")

        if isinstance(self.user, AnonymousUser):
            logger.debug("DEBUG CHAT: User is anonymous. Closing.")
            await self.close()
            return

        is_part = await self.is_participant()
        logger.debug(f"DEBUG CHAT: Is participant: {is_part}")
        if not is_part:
            logger.debug("DEBUG CHAT: Not participant. Closing.")
            await self.close()
            return

        logger.debug("DEBUG CHAT: Connection accepted.")

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    def _validate_origin(self):
        headers = dict(self.scope.get("headers", []))
        origin = headers.get(b"origin", b"").decode().strip()
        if not origin:
            # Alguns clientes WS nao enviam Origin; nesse caso aceitamos se o
            # host for conhecido (dev/local ou dominio de producao).
            host = headers.get(b"host", b"").decode().strip()
            return host and (
                host.endswith(".ufreela.com.br")
                or host in ("localhost:8000", "backend:8000", "127.0.0.1:8000")
            )

        parsed = urlparse(origin)
        allowed_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
        return any(urlparse(allowed).netloc == parsed.netloc for allowed in allowed_origins)

    @database_sync_to_async
    def _is_rate_limited(self):
        """Limita o numero de mensagens por usuario para mitigar flood."""
        if not self.user or getattr(self.user, "is_anonymous", True):
            return True

        key = f"chat_rate_limit:{self.user.id}"

        # Tenta criar a chave. Se ja existir, incrementa e verifica o limite.
        if cache.add(key, 1, timeout=RATE_LIMIT_WINDOW_SECONDS):
            return False

        try:
            current = cache.incr(key)
        except ValueError:
            # Chave expirou durante a janela de corrida; reinicia.
            cache.set(key, 1, timeout=RATE_LIMIT_WINDOW_SECONDS)
            return False

        return current > MAX_MESSAGES_PER_WINDOW

    @database_sync_to_async
    def get_user_from_token(self, token_str):
        if not token_str:
            return AnonymousUser()
        try:
            token = AccessToken(token_str)
            token.verify()
            from users.models import User

            user = User.objects.get(id=token["user_id"])
            return user if user.is_active else AnonymousUser()
        except (TokenError, InvalidToken):
            return AnonymousUser()
        except Exception:
            logger.exception("CHAT: Erro inesperado na validacao do token")
            return AnonymousUser()

    @database_sync_to_async
    def is_participant(self):
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return self.user in [conversation.user1, conversation.user2]
        except Conversation.DoesNotExist:
            return False

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    @database_sync_to_async
    def save_message_and_serialize(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )
        from .serializers import MessageSerializer

        return MessageSerializer(message).data

    async def receive(self, text_data):
        logger.debug(f"DEBUG CHAT: Received message: {text_data}")
        try:
            if await self._is_rate_limited():
                logger.warning(
                    f"CHAT: Rate limit excedido para o usuario {self.user.id}."
                )
                return

            data = json.loads(text_data)
            message_content = data.get("message", "").strip()

            if not message_content:
                return

            if len(message_content) > MAX_MESSAGE_LENGTH:
                logger.warning(f"CHAT: Mensagem excede {MAX_MESSAGE_LENGTH} caracteres.")
                return

            # Escapa entidades HTML para mitigar XSS caso o frontend renderize
            # o conteudo sem sanitizacao. Se o frontend ja escapa, o conteudo
            # sera exibido como texto literal (preferivel a script executavel).
            message_content = html.escape(message_content)

            message_data = await self.save_message_and_serialize(message_content)
            logger.debug(f"DEBUG CHAT: Message saved: {message_data}")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message_data,
                },
            )
        except json.JSONDecodeError:
            logger.warning("CHAT: Payload JSON invalido recebido.")
        except Exception as e:
            logger.error(f"DEBUG CHAT: Error in receive: {e}")

    async def chat_message(self, event):
        # Envia para o WebSocket do cliente
        await self.send(text_data=json.dumps(event["message"]))
