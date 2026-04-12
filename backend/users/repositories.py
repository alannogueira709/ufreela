from django.contrib.auth import get_user_model
from .models import Freelancer, Publisher, Role

User = get_user_model()


class UserRepository:
    @staticmethod
    def get_by_email(email: str):
        return User.objects.filter(email=email).first()

    @staticmethod
    def email_exists(email: str) -> bool:
        return User.objects.filter(email=email).exists()

    @staticmethod
    def create(email: str, password: str) -> User:
        return User.objects.create_user(email=email, password=password)

    @staticmethod
    def update_profile(user: User, **fields) -> User:
        for attr, value in fields.items():
            setattr(user, attr, value)
        user.save(update_fields=list(fields.keys()))
        return user


class RoleRepository:
    @staticmethod
    def get_by_name(name: str) -> Role:
        try:
            return Role.objects.get(role_name=name)
        except Role.DoesNotExist:
            raise ValueError(f"Role '{name}' não encontrada.")


class FreelancerRepository:
    @staticmethod
    def upsert(user: User, **fields) -> Freelancer:
        profile, _ = Freelancer.objects.update_or_create(
            user_id=user, defaults=fields
        )
        return profile


class PublisherRepository:
    @staticmethod
    def upsert(user: User, **fields) -> Publisher:
        profile, _ = Publisher.objects.update_or_create(
            user_id=user, defaults=fields
        )
        return profile