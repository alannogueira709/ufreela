from django.db import migrations, models
from django.db.models import Q


def create_profile_completion_notifications(apps, schema_editor):
    Notification = apps.get_model("notifications", "Notification")
    Freelancer = apps.get_model("users", "Freelancer")
    FreelancerSkill = apps.get_model("jobs", "FreelancerSkill")

    users_with_skills = FreelancerSkill.objects.values_list(
        "freelancer_id",
        flat=True,
    )

    for freelancer in Freelancer.objects.exclude(user_id__in=users_with_skills):
        Notification.objects.get_or_create(
            user_id=freelancer.user_id_id,
            type="profile_completion",
            defaults={
                "title": "Finalize seu perfil",
                "message": (
                    "Adicione suas skills e níveis de experiência para destacar "
                    "seu perfil e receber oportunidades mais alinhadas."
                ),
                "metadata": {"action_url": "/welcome/freelancer"},
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0002_alter_notification_type"),
        ("users", "0004_email_verification_auth_codes"),
        ("jobs", "0005_add_deadline_to_opportunity"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="type",
            field=models.CharField(
                choices=[
                    ("proposal_accepted", "Proposta aceita"),
                    ("proposal_rejected", "Proposta recusada"),
                    ("new_proposal", "Nova proposta"),
                    ("new_message", "Nova mensagem"),
                    ("payment_received", "Pagamento recebido"),
                    ("job_invitation", "Convite para vaga"),
                    ("profile_view", "Visualização de perfil"),
                    ("review_received", "Avaliação recebida"),
                    ("deadline_reminder", "Lembrete de prazo"),
                    ("profile_completion", "Conclusão do perfil"),
                ],
                max_length=30,
            ),
        ),
        migrations.AddConstraint(
            model_name="notification",
            constraint=models.UniqueConstraint(
                condition=Q(type="profile_completion"),
                fields=("user", "type"),
                name="unique_profile_completion_notification",
            ),
        ),
        migrations.RunPython(
            create_profile_completion_notifications,
            migrations.RunPython.noop,
        ),
    ]
