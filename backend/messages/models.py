import os
import uuid

from django.db import models
from users.models import User
from core.storages import get_private_storage
import datetime


def get_attachment_path(instance, filename):
    """Caminho do anexo no bucket privado.

    A chave usa UUID (nao o nome original) para evitar colisao e vazamento
    de nome no path; o nome original fica em ``attachment_name`` para
    exibicao/download.
    """
    ext = os.path.splitext(filename)[1].lower()[:10]
    return f"chat/{instance.conversation_id}/{uuid.uuid4().hex}{ext}"


class Conversation(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversation1")
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversation2")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user1", "user2")
        ordering = ["-updated_at"]

    def clean(self):
        """Garante que user1 sempre seja o UUID "menor" para evitar duplicatas."""
        super().clean()
        if self.user1_id and self.user2_id:
            if str(self.user1_id) > str(self.user2_id):
                self.user1, self.user2 = self.user2, self.user1

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Mensagens entre: {self.user1.username} e {self.user2.username}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField(blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    # Anexo opcional — bucket privado (LGPD). O download acontece apenas
    # via endpoint autorizado que gera URL assinada temporaria.
    attachment = models.FileField(
        upload_to=get_attachment_path,
        storage=get_private_storage,
        null=True,
        blank=True,
    )
    attachment_name = models.CharField(max_length=255, blank=True, default="")
    attachment_size = models.PositiveBigIntegerField(null=True, blank=True)
    attachment_content_type = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

