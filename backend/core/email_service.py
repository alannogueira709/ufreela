import logging
from typing import Optional

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger("django")


class EmailService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL
        self.frontend_url = settings.FRONTEND_URL
        self._resend_available = bool(self.api_key)

    def send_templated_email(
        self,
        to: str,
        subject: str,
        template_name: str,
        context: dict | None = None,
        text_body: str | None = None,
    ) -> bool:
        ctx = {
            "frontend_url": self.frontend_url,
            **(context or {}),
        }

        html_body = render_to_string(template_name, ctx)

        if text_body is None:
            text_body = strip_tags(html_body)

        if self._resend_available:
            return self._send_via_resend(to, subject, html_body, text_body)

        return self._send_via_django(to, subject, html_body, text_body)

    @staticmethod
    def _get_user_name(user) -> str:
        return user.name or user.email.split("@")[0]

    def send_password_reset_email(self, user, reset_url: str) -> bool:
        user_name = self._get_user_name(user)
        return self.send_templated_email(
            to=user.email,
            subject="Recuperação de Senha - uFreela",
            template_name="emails/password_reset.html",
            context={
                "user_name": user_name,
                "reset_url": reset_url,
            },
            text_body=(
                f"Olá{', ' + user_name if user_name else ''}!\n\n"
                f"Você solicitou a recuperação de senha para sua conta no uFreela.\n"
                f"Clique no link abaixo para cadastrar uma nova senha:\n\n"
                f"{reset_url}\n\n"
                f"Se você não solicitou essa alteração, por favor ignore este email.\n"
            ),
        )

    def send_welcome_email(self, user, role: str = "") -> bool:
        user_name = self._get_user_name(user)
        return self.send_templated_email(
            to=user.email,
            subject="Bem-vindo ao uFreela!",
            template_name="emails/welcome.html",
            context={
                "user_name": user_name,
                "role": role,
            },
            text_body=(
                f"Olá{', ' + user_name if user_name else ''},\n\n"
                f"Sua conta no uFreela foi criada com sucesso.\n\n"
                f"Acesse {self.frontend_url}/login para começar.\n\n"
                f"Bem-vindo!\n"
            ),
        )

    def send_notification_email(
        self,
        user,
        title: str,
        message_lines: list[str],
        action_url: str | None = None,
        action_label: str | None = None,
    ) -> bool:
        user_name = self._get_user_name(user)
        return self.send_templated_email(
            to=user.email,
            subject=title,
            template_name="emails/notification.html",
            context={
                "user_name": user_name,
                "title": title,
                "message_lines": message_lines,
                "action_url": action_url,
                "action_label": action_label,
            },
            text_body="\n\n".join(message_lines),
        )

    def _send_via_resend(
        self, to: str, subject: str, html_body: str, text_body: str
    ) -> bool:
        try:
            import resend

            resend.api_key = self.api_key

            resend.Emails.send({
                "from": self.from_email,
                "to": [to],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            })
            logger.info(f"Email enviado via Resend para {to}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Erro ao enviar email via Resend para {to}: {e}")
            logger.info(f"Fazendo fallback para Django mail backend...")
            return self._send_via_django(to, subject, html_body, text_body)

    def _send_via_django(
        self, to: str, subject: str, html_body: str, text_body: str
    ) -> bool:
        try:
            send_mail(
                subject=subject,
                message=text_body,
                from_email=self.from_email,
                recipient_list=[to],
                html_message=html_body,
                fail_silently=False,
            )
            logger.info(f"Email enviado via Django mail para {to}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Erro ao enviar email via Django mail para {to}: {e}")
            return False
