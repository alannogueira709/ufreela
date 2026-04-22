import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from jobs.models import Proposal

# ── Contratos ─────────────────────────────────────────────

class Contract(models.Model):
    class Status(models.TextChoices):
        ACTIVE     = "active",     "Ativo"
        COMPLETED  = "completed",  "Concluído"
        TERMINATED = "terminated", "Rescindido"

    contract_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal    = models.OneToOneField(
        Proposal, on_delete=models.CASCADE, related_name="contract",
    )
    start_date  = models.DateField()
    end_date    = models.DateField(null=True, blank=True)
    total_value = models.DecimalField(max_digits=10, decimal_places=2)
    status      = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE,
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Contrato {self.contract_id} — {self.status}"


# ── Pagamentos ────────────────────────────────────────────

class Payment(models.Model):
    class Method(models.TextChoices):
        CREDIT_CARD   = "credit_card",    "Cartão de Crédito"
        BANK_TRANSFER = "bank_transfer",  "Transferência Bancária"
        PAYPAL        = "paypal",         "PayPal"
        PIX           = "pix",            "Pix"

    class Status(models.TextChoices):
        PENDING   = "pending",   "Pendente"
        COMPLETED = "completed", "Concluído"
        FAILED    = "failed",    "Falhou"

    payment_id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract       = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="payments",
    )
    payment_method = models.CharField(max_length=20, choices=Method.choices, blank=True)
    amount         = models.DecimalField(max_digits=10, decimal_places=2)
    status         = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING,
    )
    paid_at        = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pagamento {self.payment_id} — {self.status}"


# ── Reviews ───────────────────────────────────────────────

class Review(models.Model):
    review_id  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract   = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="reviews",
    )
    reviewer   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_given",
    )
    reviewee   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_received",
    )
    rating     = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("contract", "reviewer")

    def __str__(self):
        return f"Review {self.review_id} — {self.rating}★"
