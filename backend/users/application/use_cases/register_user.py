import re

from users.application.dto.register_user import (RegisterUserCommand,
                                                 RegisterUserResult)
from users.application.ports.user_repository import UserRepositoryPort
from users.domain.exceptions import ConflictError, ValidationError

PASSWORD_REGEX = re.compile(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$")


class RegisterUserUseCase:
    def __init__(self, user_repository: UserRepositoryPort):
        self.user_repository = user_repository

    def execute(self, command: RegisterUserCommand) -> RegisterUserResult:
        email = command.email.strip().lower()
        password = command.password
        confirm_password = command.confirm_password

        if password != confirm_password:
            raise ValidationError("As senhas nao coincidem.")

        if not PASSWORD_REGEX.match(password):
            raise ValidationError(
                "A senha precisa ter no minimo 8 caracteres, 1 maiuscula, 1 minuscula e 1 caractere especial."
            )

        if self.user_repository.email_exists(email):
            raise ConflictError("E-mail ja cadastrado.")

        user = self.user_repository.create(email=email, password=password)

        return RegisterUserResult(user_id=str(user.id), email=user.email)
