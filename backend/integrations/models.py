import uuid

from django.conf import settings
from django.db import models
from encrypted_model_fields.fields import EncryptedTextField


class LinkedInConnection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="linkedin",
    )
    linkedin_id = models.CharField(max_length=100, unique=True)
    access_token = EncryptedTextField()
    refresh_token = EncryptedTextField(null=True, blank=True)
    expires_at = models.DateTimeField()
    profile_url = models.URLField(null=True, blank=True)
    headline = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "linkedin_connections"


class GitHubConnection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="github",
    )
    github_id = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=100)
    access_token = EncryptedTextField()
    profile_url = models.URLField()
    avatar_url = models.URLField(null=True, blank=True)
    repos_fetched = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "github_connections"


class ImportedEducation(models.Model):
    SOURCE_CHOICES = [("linkedin", "LinkedIn"), ("manual", "Manual")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="education",
    )
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="manual")
    institution = models.CharField(max_length=255)
    degree = models.CharField(max_length=255, null=True, blank=True)
    field_of_study = models.CharField(max_length=255, null=True, blank=True)
    start_year = models.IntegerField(null=True, blank=True)
    end_year = models.IntegerField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)
    linkedin_education_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "imported_education"
        ordering = ["-end_year", "-start_year", "-created_at"]


class ImportedExperience(models.Model):
    SOURCE_CHOICES = [("linkedin", "LinkedIn"), ("manual", "Manual")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="experience",
    )
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="manual")
    company = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    location = models.CharField(max_length=255, null=True, blank=True)
    start_year = models.IntegerField(null=True, blank=True)
    end_year = models.IntegerField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)
    company_logo_url = models.URLField(null=True, blank=True)
    linkedin_position_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "imported_experience"
        ordering = ["-is_current", "-end_year", "-start_year", "-created_at"]


class PortfolioProject(models.Model):
    SOURCE_CHOICES = [("github", "GitHub"), ("manual", "Manual")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolio_projects",
    )
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="manual")
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    url = models.URLField()
    image_url = models.URLField(null=True, blank=True)
    technologies = models.JSONField(default=list)
    github_repo_id = models.BigIntegerField(null=True, blank=True, unique=True)
    stars = models.IntegerField(default=0)
    forks = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "portfolio_projects"
        ordering = ["-is_featured", "display_order", "-created_at"]
