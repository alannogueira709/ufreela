import re
from dataclasses import dataclass
from typing import Optional

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

from .repositories import (FreelancerRepository, PublisherRepository,
                           RoleRepository, UserRepository)

User = get_user_model()

PASSWORD_REGEX = re.compile(r'^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$')


# ── DTOs (Data Transfer Objects) ──────────────────────────
# Substituem dicts soltos — tipagem explícita entre camadas

@dataclass
class RegisterDTO:
    email:            str
    password:         str
    confirm_password: str


@dataclass
class OnboardingDTO:
    role_id:             str
    first_name:          str = ""
    last_name:           str = ""
    cpf:                 str = ""
    company_name:        str = ""
    cnpj:                str = ""
    primary_area:        str = ""
    profile_title:       str = ""
    profile_description: str = ""
    profile_image:       Optional[object] = None


# ── Services ──────────────────────────────────────────────

class AuthService:
    """Responsabilidade única: regras de autenticação e registro."""

    @staticmethod
    def _validate_password(password: str) -> None:
        if not PASSWORD_REGEX.match(password):
            raise ValueError(
                "A senha precisa ter no mínimo 8 caracteres, "
                "1 maiúscula, 1 minúscula e 1 caractere especial."
            )

    @classmethod
    def register(cls, dto: RegisterDTO) -> User:
        cls._validate_password(dto.password)

        if dto.password != dto.confirm_password:
            raise ValueError("As senhas não coincidem.")

        if UserRepository.email_exists(dto.email):
            raise ValueError("E-mail já cadastrado.")

        return UserRepository.create(dto.email, dto.password)


class OnboardingService:
    """Responsabilidade única: completar perfil pós-registro."""

    @staticmethod
    @transaction.atomic          # tudo ou nada — User + perfil especializado
    def complete(user: User, dto: OnboardingDTO) -> User:
        role = RoleRepository.get_by_name(dto.role_id)

        OnboardingService._validate_for_role(role.role_name, dto)

        # Atualiza campos comuns no User
        try:
            user = UserRepository.update_profile(
                user,
                role=role,
                name=dto.first_name,
                last_name=dto.last_name,
                **({"profile_img": dto.profile_image} if dto.profile_image else {}),
            )
        except DjangoValidationError as e:
            if hasattr(e, "message_dict"):
                first_error = next(iter(e.message_dict.values()))
                message = first_error[0] if first_error else "Dados de perfil invalidos."
            elif hasattr(e, "messages") and e.messages:
                message = e.messages[0]
            else:
                message = "Dados de perfil invalidos."
            raise ValueError(message) from e

        # Delega criação do perfil especializado
        if role.role_name == "freelancer":
            FreelancerRepository.upsert(
                user,
                description=dto.profile_description,
                professional_level=dto.primary_area,
            )
        elif role.role_name == "publisher":
            PublisherRepository.upsert(
                user,
                company_name=dto.company_name,
                cnpj=dto.cnpj,
            )

        return user

    @staticmethod
    def _validate_for_role(role_name: str, dto: OnboardingDTO) -> None:
        if role_name == "freelancer" and not dto.first_name:
            raise ValueError("Nome é obrigatório para freelancers.")
        if role_name == "publisher" and not dto.company_name:
            raise ValueError("Razão social é obrigatória para empreendedores.")