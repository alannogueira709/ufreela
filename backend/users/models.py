import uuid
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.db import models
from encrypted_model_fields.fields import EncryptedCharField

from .managers import UserManager


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
    profile_img = models.ImageField(upload_to="profiles/", null=True, blank=True)
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


# ── Categorias e Skills ───────────────────────────────────

class Category(models.Model):
    category_id   = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=100, unique=True)
    category_slug = models.SlugField(max_length=100, unique=True)

    def __str__(self):
        return self.category_name


class Skill(models.Model):
    skill_id    = models.AutoField(primary_key=True)
    skill_name  = models.CharField(max_length=100, unique=True)
    skill_slug  = models.SlugField(max_length=100, unique=True)
    category    = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="skills",
    )

    def __str__(self):
        return self.skill_name


class FreelancerSkill(models.Model):
    class SkillLevel(models.TextChoices):
        BEGINNER     = "beginner",     "Iniciante"
        INTERMEDIATE = "intermediate", "Intermediário"
        ADVANCED     = "advanced",     "Avançado"

    freelancer = models.ForeignKey(
        Freelancer, on_delete=models.CASCADE, related_name="skills",
    )
    skill      = models.ForeignKey(
        Skill, on_delete=models.CASCADE, related_name="freelancers",
    )
    skill_level = models.CharField(
        max_length=20, choices=SkillLevel.choices, blank=True,
    )

    class Meta:
        unique_together = ("freelancer", "skill")  # evita duplicata

    def __str__(self):
        return f"{self.freelancer} — {self.skill} ({self.skill_level})"


# ── Oportunidades ─────────────────────────────────────────

class Opportunity(models.Model):
    class XpLevel(models.TextChoices):
        JUNIOR = "junior", "Junior"
        MID    = "mid",    "Mid"
        SENIOR = "senior", "Senior"

    class WorkModality(models.TextChoices):
        REMOTE  = "remote",  "Remoto"
        ONSITE  = "onsite",  "Presencial"
        HYBRID  = "hybrid",  "Híbrido"

    class Status(models.TextChoices):
        OPEN   = "open",   "Aberta"
        CLOSED = "closed", "Fechada"

    opportunity_id = models.AutoField(primary_key=True)
    publisher      = models.ForeignKey(
        Publisher, on_delete=models.CASCADE, related_name="opportunities",
    )
    category       = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="opportunities",
    )
    # ManyToMany direto — OpportunitySkills separada é redundante
    skills         = models.ManyToManyField(Skill, blank=True, related_name="opportunities")
    title          = models.CharField(max_length=200)
    description    = models.TextField()
    xp_level       = models.CharField(max_length=20, choices=XpLevel.choices, blank=True)
    work_modality  = models.CharField(max_length=20, choices=WorkModality.choices, blank=True)
    status         = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN,
    )
    budget_min     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget_max     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


# ── Propostas ─────────────────────────────────────────────

class Proposal(models.Model):
    class Status(models.TextChoices):
        PENDING  = "pending",  "Pendente"
        ACCEPTED = "accepted", "Aceita"
        REJECTED = "rejected", "Rejeitada"

    proposal_id    = models.AutoField(primary_key=True)
    opportunity    = models.ForeignKey(
        Opportunity, on_delete=models.CASCADE, related_name="proposals",
    )
    freelancer     = models.ForeignKey(
        Freelancer, on_delete=models.CASCADE, related_name="proposals",
    )
    proposed_value = models.DecimalField(max_digits=10, decimal_places=2)
    cover_letter   = models.TextField()
    status         = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING,
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        # Um freelancer só pode propor uma vez por oportunidade
        unique_together = ("opportunity", "freelancer")

    def __str__(self):
        return f"Proposta #{self.proposal_id} — {self.status}"


# ── Contratos ─────────────────────────────────────────────

class Contract(models.Model):
    class Status(models.TextChoices):
        ACTIVE     = "active",     "Ativo"
        COMPLETED  = "completed",  "Concluído"
        TERMINATED = "terminated", "Rescindido"

    contract_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal    = models.OneToOneField(  # 1 proposta → 1 contrato
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
    paid_at        = models.DateTimeField(null=True, blank=True)  # preenchido ao confirmar
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
        User, on_delete=models.CASCADE, related_name="reviews_given",
    )
    reviewee   = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="reviews_received",
    )
    rating     = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Um usuário só pode avaliar uma vez por contrato
        unique_together = ("contract", "reviewer")

    def __str__(self):
        return f"Review {self.review_id} — {self.rating}★"
