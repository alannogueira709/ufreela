import uuid
from io import BytesIO

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from encrypted_model_fields.fields import EncryptedCharField
from PIL import Image

from .managers import UserManager


def get_profile_image_path(instance, filename):
    return f"profile/{instance.id}/profile.webp"

# ── Roles ─────────────────────────────────────────────────

class Role(models.Model):
    role_id   = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.role_name


# ── User ──────────────────────────────────────────────────

class User(AbstractUser):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role        = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    email       = models.EmailField(unique=True)
    name        = models.CharField(max_length=100, blank=True)
    last_name   = models.CharField(max_length=100, blank=True)
    oauth_id    = EncryptedCharField(max_length=200, blank=True)
    profile_img = models.ImageField(
        upload_to=get_profile_image_path, 
        null=True,
        blank=True
        )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    groups = models.ManyToManyField(
        "auth.Group",
        blank=True,
        related_name="custom_user_groups",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        blank=True,
        related_name="custom_user_permissions",
    )

    def __str__(self):
        return self.email

    def clean(self):
        super().clean()

        if self.profile_img:
            max_upload_size = 5 * 1024 * 1024  # 5MB
            if getattr(self.profile_img, "size", 0) > max_upload_size:
                raise ValidationError({
                    "profile_img": "A imagem deve ter no maximo 5MB.",
                })

            try:
                self.profile_img.seek(0)
                img = Image.open(self.profile_img)
                img.verify()
            except Exception as exc:
                raise ValidationError({
                    "profile_img": "O arquivo enviado e invalido ou esta corrompido.",
                }) from exc

    def save(self, *args, **kwargs):
        if self.profile_img and not getattr(self.profile_img, "_committed", True):
            self.profile_img.seek(0)
            img = Image.open(self.profile_img)
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")

            img.thumbnail((500, 500), Image.Resampling.LANCZOS)

            img_io = BytesIO()
            img.save(img_io, format="WEBP", quality=85, optimize=True)
            img_io.seek(0)

            self.profile_img = ContentFile(img_io.read(), name="profile.webp")

        super().save(*args, **kwargs)
# ── Perfis especializados ─────────────────────────────────

class Freelancer(models.Model):
    class ProfessionalLevel(models.TextChoices):
        JUNIOR = "junior", "Junior"
        MID    = "mid",    "Mid"
        SENIOR = "senior", "Senior"

    user_id            = models.OneToOneField(
        User, on_delete=models.CASCADE,
        primary_key=True, related_name="freelancer_profile",
    )
    description        = models.TextField(blank=True)
    finished_jobs      = models.IntegerField(default=0)
    professional_level = models.CharField(
        max_length=20, choices=ProfessionalLevel.choices, blank=True,
    )
    hourly_rate        = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    mean_eval          = models.DecimalField(max_digits=3,
                                              decimal_places=2, 
                                              default=0,
                                              validators=[MinValueValidator(0), MaxValueValidator(5)],
                                              )

    def __str__(self):
        return f"Freelancer: {self.user_id.email}"


class Publisher(models.Model):
    user_id      = models.OneToOneField(
        User, on_delete=models.CASCADE,
        primary_key=True, related_name="publisher_profile",
    )
    company_name = models.CharField(max_length=200, blank=True)
    cnpj         = EncryptedCharField(max_length=18, blank=True)
    mean_eval    = models.DecimalField(max_digits=3, 
                                       decimal_places=2, 
                                       default=0,
                                       validators=[MinValueValidator(0), MaxValueValidator(5)],
                                       )

    def __str__(self):
        return f"Publisher: {self.company_name or self.user_id.email}"

# ── Itens Salvos ──────────────────────────────────────────

class SavedProfile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_profiles")
    saved_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "saved_user")

    def __str__(self):
        return f"{self.user.email} saved {self.saved_user.email}"

