import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from jobs.models import Proposal


class Contract(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Ativo"
        COMPLETED = "completed", "Concluído"
        TERMINATED = "terminated", "Rescindido"

    contract_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.OneToOneField(
        Proposal,
        on_delete=models.CASCADE,
        related_name="contract",
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    total_value = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    freelancer_completion_approved = models.BooleanField(default=False)
    publisher_completion_approved = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    escrow_released_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Contrato {self.contract_id} - {self.status}"


class Payment(models.Model):
    class Method(models.TextChoices):
        CREDIT_CARD = "credit_card", "Cartão de Crédito"
        BANK_TRANSFER = "bank_transfer", "Transferência Bancária"
        PAYPAL = "paypal", "PayPal"
        PIX = "pix", "Pix"

    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        COMPLETED = "completed", "Concluído"
        FAILED = "failed", "Falhou"

    payment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    payment_method = models.CharField(max_length=20, choices=Method.choices, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pagamento {self.payment_id} - {self.status}"


class Review(models.Model):
    review_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_given",
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_received",
    )
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("contract", "reviewer")

    def __str__(self):
        return f"Review {self.review_id} - {self.rating}"


class StripeAccount(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        ACTIVE = "active", "Ativo"
        RESTRICTED = "restricted", "Restrito"
        REJECTED = "rejected", "Rejeitado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stripe_account",
    )
    stripe_account_id = models.CharField(max_length=255, unique=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    charges_enabled = models.BooleanField(default=False)
    payouts_enabled = models.BooleanField(default=False)
    requirements_due = models.JSONField(default=list, blank=True)
    country = models.CharField(max_length=2, default="BR")
    currency = models.CharField(max_length=3, default="brl")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "stripe_accounts"

    def __str__(self):
        return f"StripeAccount({self.user_id}, {self.status})"


class PaymentMethod(models.Model):
    class Type(models.TextChoices):
        CARD = "card", "Cartao"
        BOLETO = "boleto", "Boleto"
        PIX = "pix", "PIX"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_methods",
    )
    stripe_payment_method_id = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=20, choices=Type.choices)
    last4 = models.CharField(max_length=4, null=True, blank=True)
    brand = models.CharField(max_length=50, null=True, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payment_methods"

    def __str__(self):
        return f"PaymentMethod({self.user_id}, {self.type})"


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PROCESSING = "processing", "Processando"
        COMPLETED = "completed", "Concluido"
        FAILED = "failed", "Falhou"
        REFUNDED = "refunded", "Reembolsado"

    class Type(models.TextChoices):
        DEPOSIT = "deposit", "Deposito"
        WITHDRAWAL = "withdrawal", "Saque"
        PAYMENT = "payment", "Pagamento"
        FEE = "fee", "Taxa"
        REFUND = "refund", "Reembolso"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stripe_payment_intent_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_transfer_id = models.CharField(max_length=255, null=True, blank=True)
    publisher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments_made",
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments_received",
        null=True,
        blank=True,
    )
    job_id = models.CharField(max_length=64, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    freelancer_amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Transaction({self.id}, {self.status})"
