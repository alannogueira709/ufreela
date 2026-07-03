from django.db import models 
from users.models import User
import datetime

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
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

