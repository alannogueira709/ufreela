import uuid

from django.conf import settings
from django.db import models


class UserSettings(models.Model):
    THEME_CHOICES = [
        ("light", "Light"),
        ("dark", "Dark"),
        ("system", "System"),
    ]
    LANG_CHOICES = [
        ("pt-BR", "Portugues (Brasil)"),
        ("en-US", "English (US)"),
        ("es", "Espanol"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="settings",
    )
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default="system")
    compact_mode = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    profile_visible = models.BooleanField(default=True)
    show_activity_status = models.BooleanField(default=True)
    language = models.CharField(max_length=10, choices=LANG_CHOICES, default="pt-BR")
    timezone = models.CharField(max_length=50, default="America/Sao_Paulo")
    two_factor_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_settings"

    def __str__(self):
        return f"Settings({self.user.email})"

