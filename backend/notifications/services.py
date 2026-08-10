from notifications.models import Notification
from jobs.models import FreelancerSkill


def ensure_profile_completion_notification(user):
    if FreelancerSkill.objects.filter(freelancer__user_id=user.id).exists():
        return None

    notification, _ = Notification.objects.get_or_create(
        user=user,
        type=Notification.Type.PROFILE_COMPLETION,
        defaults={
            "title": "Finalize seu perfil",
            "message": (
                "Adicione suas skills e níveis de experiência para destacar seu "
                "perfil e receber oportunidades mais alinhadas."
            ),
            "metadata": {"action_url": "/welcome/freelancer"},
        },
    )
    return notification


def mark_profile_completion_notification_read(user):
    Notification.objects.filter(
        user=user,
        type=Notification.Type.PROFILE_COMPLETION,
        read=False,
    ).update(read=True)
