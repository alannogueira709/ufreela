import secrets
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone

from .models import AuthCode


class AuthCodeService:
    EXPIRATION = timedelta(minutes=15)
    MAX_ATTEMPTS = 5

    @classmethod
    def issue(cls, user, purpose: str) -> str:
        now = timezone.now()
        AuthCode.objects.filter(
            user=user,
            purpose=purpose,
            used_at__isnull=True,
        ).update(used_at=now)

        code = f"{secrets.randbelow(1_000_000):06d}"
        AuthCode.objects.create(
            user=user,
            email=user.email,
            purpose=purpose,
            code_hash=make_password(code),
            expires_at=now + cls.EXPIRATION,
        )
        return code

    @classmethod
    def consume(cls, email: str, purpose: str, code: str) -> bool:
        normalized_email = email.strip().lower()
        now = timezone.now()

        with transaction.atomic():
            auth_code = (
                AuthCode.objects.select_for_update()
                .filter(
                    email__iexact=normalized_email,
                    purpose=purpose,
                    used_at__isnull=True,
                )
                .order_by("-created_at")
                .first()
            )

            if auth_code is None:
                return False

            if auth_code.expires_at <= now or auth_code.attempts >= cls.MAX_ATTEMPTS:
                auth_code.used_at = now
                auth_code.save(update_fields=["used_at"])
                return False

            if not check_password(code, auth_code.code_hash):
                auth_code.attempts += 1
                update_fields = ["attempts"]
                if auth_code.attempts >= cls.MAX_ATTEMPTS:
                    auth_code.used_at = now
                    update_fields.append("used_at")
                auth_code.save(update_fields=update_fields)
                return False

            auth_code.used_at = now
            auth_code.save(update_fields=["used_at"])
            return True
