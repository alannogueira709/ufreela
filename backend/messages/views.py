from rest_framework import generics, permissions, status
from rest_framework.response import Response 
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from users.models import User

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

        u1, u2 = sorted([request.user.id, int(other_user_id)])

        conversation, created = Conversation.objects.get_or_create(
            user1_id=u1,
            user2_id=u2,
            defaults={
                "user1": request.user if u1 == request.user.id else other_user,
                "user2": other_user if u1 == request.user.id else request.user
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

        if self.request.user not in [conversation.user1, conversation.user2]:
            return Message.objects.none()
            
        return conversation.messages.all()

class MarkAsReadView(generics.UpdateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if self.request.user not in [conversation.user1, conversation.user2]:
            return Message.objects.none()
            
        return conversation.messages.all()

    def update(self, request, *args, **kwargs):
        conversation = self.get_queryset()
        conversation.update(is_read=True)
        return Response({"detail": "Mensagens marcadas como lidas"}, status=status.HTTP_200_OK)

class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]