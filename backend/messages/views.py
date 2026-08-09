import html
import mimetypes
from pathlib import Path
from urllib.parse import quote

from django.core.files.storage import FileSystemStorage
from django.http import FileResponse
from django.shortcuts import get_object_or_404, redirect
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from users.models import User


MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
ALLOWED_ATTACHMENT_TYPES = {
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
}


def is_allowed_attachment(file):
    content_type = (file.content_type or '').lower()
    filename = Path(file.name).name

    # SVG is excluded even though it is an image MIME type because it can
    # contain executable markup when opened in a browser.
    if content_type == 'image/svg+xml' or filename.lower().endswith('.svg'):
        return False

    return content_type.startswith('image/') or content_type in ALLOWED_ATTACHMENT_TYPES


def is_conversation_participant(user, conversation):
    return user == conversation.user1 or user == conversation.user2

class ConversationListView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(user1=user) | Q(user2=user))

    def create(self, request, *args, **kwargs):
        other_user_id = request.data.get("other_user")
        user = request.user

        if not other_user_id:
            return Response(
                {"error": "Outro usuário é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if str(user.id) == str(other_user_id):
            return Response(
                {"error": "Você não pode iniciar uma conversa consigo mesmo"},
                status=status.HTTP_400_BAD_REQUEST
            )
        other_user = get_object_or_404(User, id=other_user_id)

        u1_str = str(request.user.id)
        u2_str = str(other_user.id)

        u1, u2 = sorted([u1_str, u2_str])
        
        user1_obj = request.user if u1 == u1_str else other_user
        user2_obj = other_user if u1 == u1_str else request.user

        conversation, created = Conversation.objects.get_or_create(
            user1_id=u1,
            user2_id=u2,
            defaults={
                "user1": user1_obj,
                "user2": user2_obj
            }
        )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if not is_conversation_participant(self.request.user, conversation):
            return Message.objects.none()
            
        return conversation.messages.all()

class MarkAsReadView(generics.UpdateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if not is_conversation_participant(self.request.user, conversation):
            return Message.objects.none()
            
        return conversation.messages.all()

    def update(self, request, *args, **kwargs):
        conversation = self.get_queryset()
        conversation.exclude(sender=request.user).update(is_read=True)
        return Response({"detail": "Mensagens marcadas como lidas"}, status=status.HTTP_200_OK)

class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        conversation_id = self.request.data.get('conversation')
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if not is_conversation_participant(self.request.user, conversation):
            raise PermissionDenied("Você não tem permissão para enviar mensagens nesta conversa.")
        serializer.save(sender=self.request.user, conversation=conversation)
        conversation.save(update_fields=['updated_at'])


class AttachmentUploadView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if not is_conversation_participant(request.user, conversation):
            raise PermissionDenied("Você não tem permissão para enviar arquivos nesta conversa.")

        attachment = request.FILES.get('file')
        if not attachment:
            return Response(
                {'detail': 'Selecione um arquivo para enviar.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attachment.size > MAX_ATTACHMENT_SIZE:
            return Response(
                {'detail': 'O tamanho máximo por arquivo é de 10 MB.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not is_allowed_attachment(attachment):
            return Response(
                {'detail': 'Esse tipo de arquivo não é permitido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        original_name = Path(attachment.name).name[:255]
        content = str(request.data.get('content', '')).strip()[:2000]
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=html.escape(content),
            attachment=attachment,
            attachment_name=original_name,
            attachment_size=attachment.size,
            attachment_content_type=attachment.content_type or mimetypes.guess_type(original_name)[0] or '',
        )
        conversation.save(update_fields=['updated_at'])

        message_data = dict(MessageSerializer(message).data)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{conversation.id}',
            {'type': 'chat_message', 'message': message_data},
        )

        return Response(message_data, status=status.HTTP_201_CREATED)


class AttachmentDownloadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, message_id):
        message = get_object_or_404(
            Message.objects.select_related('conversation'),
            id=message_id,
        )

        if not is_conversation_participant(request.user, message.conversation):
            raise PermissionDenied("Você não tem permissão para acessar este arquivo.")

        if not message.attachment:
            return Response(
                {'detail': 'Esta mensagem não possui anexo.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        content_type = message.attachment_content_type or mimetypes.guess_type(
            message.attachment_name or message.attachment.name
        )[0] or 'application/octet-stream'
        is_image = content_type.startswith('image/')
        filename = message.attachment_name or 'anexo'
        storage = message.attachment.storage

        # Keep local development private too: do not redirect to /media.
        if isinstance(storage, FileSystemStorage):
            return FileResponse(
                message.attachment.open('rb'),
                as_attachment=not is_image,
                filename=filename,
                content_type=content_type,
            )

        disposition = 'inline' if is_image else 'attachment'
        signed_url = storage.url(
            message.attachment.name,
            parameters={
                'ResponseContentDisposition': f"{disposition}; filename*=UTF-8''{quote(filename)}",
                'ResponseContentType': content_type,
            },
        )
        return redirect(signed_url)
