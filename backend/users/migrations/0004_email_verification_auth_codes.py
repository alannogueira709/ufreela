from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def mark_existing_users_as_verified(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(email_verified=False).update(
        email_verified=True,
        email_verified_at=django.utils.timezone.now(),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_seed_roles"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="email_verified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="AuthCode",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("email", models.EmailField(max_length=254)),
                (
                    "purpose",
                    models.CharField(
                        choices=[
                            ("email_verification", "Verificacao de email"),
                            ("password_reset", "Redefinicao de senha"),
                        ],
                        max_length=30,
                    ),
                ),
                ("code_hash", models.CharField(max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="auth_codes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(
                        fields=["email", "purpose", "created_at"],
                        name="users_authc_email_bbf6cc_idx",
                    ),
                    models.Index(
                        fields=["user", "purpose", "used_at"],
                        name="users_authc_user_id_8f308e_idx",
                    ),
                ],
            },
        ),
        migrations.RunPython(mark_existing_users_as_verified, migrations.RunPython.noop),
    ]
