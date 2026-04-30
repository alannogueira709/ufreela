from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email: str, password: str = None, **extra_fields):
        if not email:
            raise ValueError("E-mail é obrigatório.")
        email = self.normalize_email(email)
        # Avoid passing username twice when createsuperuser already provides it.
        extra_fields.setdefault("username", email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

    def with_role(self, role_name: str):
        """Retorna usuários filtrando por role."""
        return self.filter(role__role_name=role_name).select_related("role")

    def with_full_profile(self):
        """Prefetch completo para evitar N+1."""
        return self.select_related(
            "role",
            "freelancer_profile",
            "publisher_profile",
        )