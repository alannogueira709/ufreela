import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserSettings",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("theme", models.CharField(choices=[("light", "Light"), ("dark", "Dark"), ("system", "System")], default="system", max_length=10)),
                ("compact_mode", models.BooleanField(default=False)),
                ("email_notifications", models.BooleanField(default=True)),
                ("push_notifications", models.BooleanField(default=True)),
                ("marketing_emails", models.BooleanField(default=False)),
                ("profile_visible", models.BooleanField(default=True)),
                ("show_activity_status", models.BooleanField(default=True)),
                ("language", models.CharField(choices=[("pt-BR", "Portugues (Brasil)"), ("en-US", "English (US)"), ("es", "Espanol")], default="pt-BR", max_length=10)),
                ("timezone", models.CharField(default="America/Sao_Paulo", max_length=50)),
                ("two_factor_enabled", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="settings", to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table": "user_settings"},
        ),
    ]
