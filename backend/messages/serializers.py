from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'profile_img']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    has_attachment = serializers.SerializerMethodField()

    def get_has_attachment(self, obj):
        return bool(obj.attachment)

    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'content',
            'timestamp',
            'is_read',
            'attachment_name',
            'attachment_size',
            'attachment_content_type',
            'has_attachment',
        ]
        read_only_fields = [
            'id',
            'timestamp',
            'sender',
            'attachment_name',
            'attachment_size',
            'attachment_content_type',
            'has_attachment',
        ]

class ConversationSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return MessageSerializer(last_msg).data if last_msg else None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
    
    class Meta:
        model = Conversation
        fields = ['id', 'user1', 'user2', 'last_message', 'unread_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
