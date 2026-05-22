import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction as db_transaction

from jobs.models import Opportunity, Proposal
from finances.models import Transaction
from notifications.models import Notification
from users.models import User, Freelancer

logger = logging.getLogger("django")


def _send_notification_email(user, title, message):
    """
    Auxiliar para enviar email respeitando as preferências do usuário.
    """
    try:
        user_settings = user.settings
        email_enabled = user_settings.email_notifications
    except Exception:
        email_enabled = True  # Padrão é True se não configurado

    if not email_enabled:
        return

    try:
        send_mail(
            subject=title,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Erro ao enviar email de notificação para {user.email}: {str(e)}")


@receiver(post_save, sender=Opportunity)
def opportunity_created_signal(sender, instance, created, **kwargs):
    """
    Notifica freelancers elegíveis quando uma nova vaga é criada.
    """
    if not created:
        return

    vaga_skills = instance.skills.all()
    freelancers_to_notify = set()

    if vaga_skills:
        # Acha freelancers com pelo menos uma skill coincidente
        matching_freelancers = Freelancer.objects.filter(
            skills__skill__in=vaga_skills
        ).select_related("user_id")
        for f in matching_freelancers:
            freelancers_to_notify.add(f.user_id)

    # Fallback: se nenhum freelancer com aquela skill foi encontrado, notifica os gerais
    if not freelancers_to_notify:
        general_freelancers = Freelancer.objects.all().select_related("user_id")[:50]
        for f in general_freelancers:
            freelancers_to_notify.add(f.user_id)

    title = f"Nova vaga publicada: {instance.title}"
    message = (
        f"Olá,\n\n"
        f"Uma nova oportunidade de trabalho foi publicada no uFreela e pode ser do seu interesse!\n\n"
        f"Título: {instance.title}\n"
        f"Descrição: {instance.description[:200]}...\n"
        f"Nível de XP: {instance.get_xp_level_display() if instance.xp_level else 'Não especificado'}\n"
        f"Modalidade: {instance.get_work_modality_display() if instance.work_modality else 'Não especificado'}\n"
        f"Orçamento: R$ {instance.budget_min or 0} - R$ {instance.budget_max or 0}\n\n"
        f"Acesse o uFreela para enviar sua proposta:\n"
        f"{settings.FRONTEND_URL}/jobs/{instance.opportunity_id}\n"
    )

    for user in freelancers_to_notify:
        if user == instance.publisher.user_id:
            continue

        Notification.objects.create(
            user=user,
            type=Notification.Type.JOB_INVITATION,
            title=title,
            message=f"Orçamento: R$ {instance.budget_min or 0} - R$ {instance.budget_max or 0}",
            metadata={"opportunity_id": str(instance.opportunity_id)},
        )

        db_transaction.on_commit(
            lambda u=user, t=title, m=message: _send_notification_email(u, t, m)
        )


@receiver(post_save, sender=Proposal)
def proposal_saved_signal(sender, instance, created, **kwargs):
    """
    Notifica o publisher sobre uma nova proposta, ou o freelancer sobre a aceitação/rejeição.
    """
    if created:
        # Nova Proposta: Notifica o cliente (Publisher)
        publisher_user = instance.opportunity.publisher.user_id
        title = f"Nova proposta para sua vaga: {instance.opportunity.title}"
        message = (
            f"Olá,\n\n"
            f"Você recebeu uma nova proposta de trabalho para a sua oportunidade '{instance.opportunity.title}'.\n\n"
            f"Valor Proposto: R$ {instance.proposed_value}\n"
            f"Carta de Apresentação:\n{instance.cover_letter[:300]}...\n\n"
            f"Acesse o uFreela para analisar e responder a essa proposta:\n"
            f"{settings.FRONTEND_URL}/proposals\n"
        )

        Notification.objects.create(
            user=publisher_user,
            type=Notification.Type.NEW_PROPOSAL,
            title=title,
            message=f"Valor proposto: R$ {instance.proposed_value}",
            metadata={
                "proposal_id": str(instance.proposal_id),
                "opportunity_id": str(instance.opportunity.opportunity_id)
            },
        )

        db_transaction.on_commit(
            lambda u=publisher_user, t=title, m=message: _send_notification_email(u, t, m)
        )

    else:
        # Mudança de Status: Notifica o Freelancer se foi aceito ou rejeitado
        freelancer_user = instance.freelancer.user_id
        
        if instance.status == Proposal.Status.ACCEPTED:
            title = f"Sua proposta foi aceita!"
            message = (
                f"Parabéns!\n\n"
                f"Sua proposta para a vaga '{instance.opportunity.title}' foi aceita pelo cliente.\n"
                f"Valor acordado: R$ {instance.proposed_value}\n\n"
                f"Acesse sua área de trabalho para iniciar o contrato:\n"
                f"{settings.FRONTEND_URL}/proposals\n"
            )
            Notification.objects.create(
                user=freelancer_user,
                type=Notification.Type.PROPOSAL_ACCEPTED,
                title=title,
                message=f"Sua proposta para '{instance.opportunity.title}' foi aceita!",
                metadata={
                    "proposal_id": str(instance.proposal_id),
                    "opportunity_id": str(instance.opportunity.opportunity_id)
                },
            )
            db_transaction.on_commit(
                lambda u=freelancer_user, t=title, m=message: _send_notification_email(u, t, m)
            )

        elif instance.status == Proposal.Status.REJECTED:
            title = f"Atualização sobre sua proposta"
            message = (
                f"Olá,\n\n"
                f"Sua proposta para a vaga '{instance.opportunity.title}' foi recusada.\n"
                f"Não desanime! Continue procurando por novas oportunidades no portal uFreela.\n"
            )
            Notification.objects.create(
                user=freelancer_user,
                type=Notification.Type.PROPOSAL_REJECTED,
                title=title,
                message=f"Sua proposta para '{instance.opportunity.title}' foi recusada.",
                metadata={
                    "proposal_id": str(instance.proposal_id),
                    "opportunity_id": str(instance.opportunity.opportunity_id)
                },
            )
            db_transaction.on_commit(
                lambda u=freelancer_user, t=title, m=message: _send_notification_email(u, t, m)
            )


@receiver(post_save, sender=Transaction)
def transaction_saved_signal(sender, instance, created, **kwargs):
    """
    Notifica freelancer e publisher quando um pagamento é concluído.
    """
    if instance.status != Transaction.Status.COMPLETED:
        return

    # Notifica o Freelancer
    if instance.freelancer:
        freelancer_user = instance.freelancer
        title = "Pagamento recebido!"
        message = (
            f"Olá,\n\n"
            f"Um pagamento no valor de R$ {instance.freelancer_amount} foi liberado em sua conta uFreela.\n"
            f"Descrição: {instance.description}\n\n"
            f"Obrigado por utilizar o uFreela!\n"
        )
        Notification.objects.create(
            user=freelancer_user,
            type=Notification.Type.PAYMENT_RECEIVED,
            title=title,
            message=f"Recebido: R$ {instance.freelancer_amount}",
            metadata={"transaction_id": str(instance.id)},
        )
        db_transaction.on_commit(
            lambda u=freelancer_user, t=title, m=message: _send_notification_email(u, t, m)
        )

    # Notifica o Publisher (quem fez o pagamento)
    publisher_user = instance.publisher
    title = "Pagamento efetuado com sucesso"
    message = (
        f"Olá,\n\n"
        f"Confirmamos a liquidação do pagamento no valor de R$ {instance.amount}.\n"
        f"Descrição: {instance.description}\n\n"
        f"Agradecemos pela parceria!\n"
    )
    Notification.objects.create(
        user=publisher_user,
        type=Notification.Type.PAYMENT_RECEIVED,
        title=title,
        message=f"Valor pago: R$ {instance.amount}",
        metadata={"transaction_id": str(instance.id)},
    )
    db_transaction.on_commit(
        lambda u=publisher_user, t=title, m=message: _send_notification_email(u, t, m)
    )
