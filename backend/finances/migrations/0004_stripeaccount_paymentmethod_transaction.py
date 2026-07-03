import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("finances", "0003_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentMethod",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("stripe_payment_method_id", models.CharField(max_length=255, unique=True)),
                ("type", models.CharField(choices=[("card", "Cartao"), ("boleto", "Boleto"), ("pix", "PIX")], max_length=20)),
                ("last4", models.CharField(blank=True, max_length=4, null=True)),
                ("brand", models.CharField(blank=True, max_length=50, null=True)),
                ("is_default", models.BooleanField(default=False)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_methods",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "payment_methods"},
        ),
        migrations.CreateModel(
            name="StripeAccount",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("stripe_account_id", models.CharField(max_length=255, unique=True)),
                ("status", models.CharField(choices=[("pending", "Pendente"), ("active", "Ativo"), ("restricted", "Restrito"), ("rejected", "Rejeitado")], default="pending", max_length=20)),
                ("charges_enabled", models.BooleanField(default=False)),
                ("payouts_enabled", models.BooleanField(default=False)),
                ("requirements_due", models.JSONField(blank=True, default=list)),
                ("country", models.CharField(default="BR", max_length=2)),
                ("currency", models.CharField(default="brl", max_length=3)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stripe_account",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "stripe_accounts"},
        ),
        migrations.CreateModel(
            name="Transaction",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("stripe_payment_intent_id", models.CharField(blank=True, max_length=255, null=True)),
                ("stripe_transfer_id", models.CharField(blank=True, max_length=255, null=True)),
                ("job_id", models.CharField(blank=True, max_length=64, null=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("platform_fee", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("freelancer_amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("type", models.CharField(choices=[("deposit", "Deposito"), ("withdrawal", "Saque"), ("payment", "Pagamento"), ("fee", "Taxa"), ("refund", "Reembolso")], max_length=20)),
                ("status", models.CharField(choices=[("pending", "Pendente"), ("processing", "Processando"), ("completed", "Concluido"), ("failed", "Falhou"), ("refunded", "Reembolsado")], default="pending", max_length=20)),
                ("description", models.TextField()),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "freelancer",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payments_received",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "publisher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payments_made",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "transactions",
                "ordering": ["-created_at"],
            },
        ),
    ]
