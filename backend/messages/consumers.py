import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from .models import Conversation, Message

logger = logging.getLogger("django")


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # Autenticação via token na query string: ?token=<jwt>
        query_string = self.scope['query_string'].decode()
        token = self._extract_token(query_string)
        
        if not token and 'cookies' in self.scope:
            token = self.scope['cookies'].get('access_token', '')

        self.user = await self.get_user_from_token(token)
        logger.debug(f"DEBUG CHAT: User extracted from token: {self.user}")

        if isinstance(self.user, AnonymousUser):
            logger.debug("DEBUG CHAT: User is anonymous. Closing.")
            await self.close()
            return

        # Verifica se o usuário pertence à conversa
        is_part = await self.is_participant()
        logger.debug(f"DEBUG CHAT: Is participant: {is_part}")
        if not is_part:
            logger.debug("DEBUG CHAT: Not participant. Closing.")
            await self.close()
            return

        logger.debug("DEBUG CHAT: Connection accepted.")

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    def _extract_token(self, query_string):
        # Extrai token de ?token=xyz
        params = dict(p.split('=') for p in query_string.split('&') if '=' in p)
        return params.get('token', '')

    @database_sync_to_async
    def get_user_from_token(self, token_str):
        try:
            token = AccessToken(token_str)
            from users.models import User
            return User.objects.get(id=token['user_id'])
        except Exception:
            from django.contrib.auth.models import AnonymousUser
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
            content=content
        )
        from .serializers import MessageSerializer
        return MessageSerializer(message).data

    async def receive(self, text_data):
        logger.debug(f"DEBUG CHAT: Received message: {text_data}")
        try:
            data = json.loads(text_data)
            message_content = data.get('message', '').strip()
            
            if not message_content:
                return

            # Salva no banco e serializa com MessageSerializer
            message_data = await self.save_message_and_serialize(message_content)
            logger.debug(f"DEBUG CHAT: Message saved: {message_data}")
            
            # Envia para o grupo
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )
        except Exception as e:
            logger.error(f"DEBUG CHAT: Error in receive: {e}")

    async def chat_message(self, event):
        # Envia para o WebSocket do cliente
        await self.send(text_data=json.dumps(event['message']))