from django.contrib.auth import get_user_model

User = get_user_model()


class DjangoUserRepository:
    def email_exists(self, email: str) -> bool:
        return User.objects.filter(email=email).exists()

    def exists_by_email(self, email: str) -> bool:
        return self.email_exists(email)

    def create(self, email: str, password: str):
        return User.objects.create_user(email=email, password=password)

    def create_user(self, email: str, password: str):
        return self.create(email=email, password=password)
