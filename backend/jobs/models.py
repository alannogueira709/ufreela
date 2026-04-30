from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import Freelancer, Publisher

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
        unique_together = ("freelancer", "skill")

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
    deadline       = models.DateField(null=True, blank=True)
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
        unique_together = ("opportunity", "freelancer")

    def __str__(self):
        return f"Proposta #{self.proposal_id} — {self.status}"

# ── Vagas Salvas ──────────────────────────────────────────

class SavedOpportunity(models.Model):
    user = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="saved_opportunities",
    )
    opportunity = models.ForeignKey(
        Opportunity, on_delete=models.CASCADE, related_name="saved_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "opportunity")

    def __str__(self):
        return f"{self.user.email} saved {self.opportunity.title}"
