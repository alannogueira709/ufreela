import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    Notificação persistida em banco, vinculada a um usuário autenticado.
    """

    class Type(models.TextChoices):
        PROPOSAL_ACCEPTED = "proposal_accepted", "Proposta aceita"
        PROPOSAL_REJECTED = "proposal_rejected", "Proposta recusada"
        NEW_PROPOSAL = "new_proposal", "Nova proposta"
        NEW_MESSAGE = "new_message", "Nova mensagem"
        PAYMENT_RECEIVED = "payment_received", "Pagamento recebido"
        JOB_INVITATION = "job_invitation", "Convite para vaga"
        PROFILE_VIEW = "profile_view", "Visualização de perfil"
        REVIEW_RECEIVED = "review_received", "Avaliação recebida"
        DEADLINE_REMINDER = "deadline_reminder", "Lembrete de prazo"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True, default="")
    read = models.BooleanField(default=False)

    # Metadados opcionais (JSON livre)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type}] {self.title} → {self.user}"
