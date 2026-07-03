import uuid

import django.db.models.deletion
import encrypted_model_fields.fields
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="GitHubConnection",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("github_id", models.CharField(max_length=100, unique=True)),
                ("username", models.CharField(max_length=100)),
                ("access_token", encrypted_model_fields.fields.EncryptedTextField()),
                ("profile_url", models.URLField()),
                ("avatar_url", models.URLField(blank=True, null=True)),
                ("repos_fetched", models.IntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="github",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "github_connections"},
        ),
        migrations.CreateModel(
            name="LinkedInConnection",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("linkedin_id", models.CharField(max_length=100, unique=True)),
                ("access_token", encrypted_model_fields.fields.EncryptedTextField()),
                ("refresh_token", encrypted_model_fields.fields.EncryptedTextField(blank=True, null=True)),
                ("expires_at", models.DateTimeField()),
                ("profile_url", models.URLField(blank=True, null=True)),
                ("headline", models.CharField(blank=True, max_length=255, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="linkedin",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "linkedin_connections"},
        ),
        migrations.CreateModel(
            name="ImportedEducation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("source", models.CharField(choices=[("linkedin", "LinkedIn"), ("manual", "Manual")], default="manual", max_length=20)),
                ("institution", models.CharField(max_length=255)),
                ("degree", models.CharField(blank=True, max_length=255, null=True)),
                ("field_of_study", models.CharField(blank=True, max_length=255, null=True)),
                ("start_year", models.IntegerField(blank=True, null=True)),
                ("end_year", models.IntegerField(blank=True, null=True)),
                ("is_current", models.BooleanField(default=False)),
                ("description", models.TextField(blank=True, null=True)),
                ("linkedin_education_id", models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="education",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "imported_education",
                "ordering": ["-end_year", "-start_year", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ImportedExperience",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("source", models.CharField(choices=[("linkedin", "LinkedIn"), ("manual", "Manual")], default="manual", max_length=20)),
                ("company", models.CharField(max_length=255)),
                ("title", models.CharField(max_length=255)),
                ("location", models.CharField(blank=True, max_length=255, null=True)),
                ("start_year", models.IntegerField(blank=True, null=True)),
                ("end_year", models.IntegerField(blank=True, null=True)),
                ("is_current", models.BooleanField(default=False)),
                ("description", models.TextField(blank=True, null=True)),
                ("company_logo_url", models.URLField(blank=True, null=True)),
                ("linkedin_position_id", models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="experience",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "imported_experience",
                "ordering": ["-is_current", "-end_year", "-start_year", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="PortfolioProject",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("source", models.CharField(choices=[("github", "GitHub"), ("manual", "Manual")], default="manual", max_length=20)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, null=True)),
                ("url", models.URLField()),
                ("image_url", models.URLField(blank=True, null=True)),
                ("technologies", models.JSONField(default=list)),
                ("github_repo_id", models.BigIntegerField(blank=True, null=True, unique=True)),
                ("stars", models.IntegerField(default=0)),
                ("forks", models.IntegerField(default=0)),
                ("is_featured", models.BooleanField(default=False)),
                ("display_order", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="portfolio_projects",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "portfolio_projects",
                "ordering": ["-is_featured", "display_order", "-created_at"],
            },
        ),
    ]
