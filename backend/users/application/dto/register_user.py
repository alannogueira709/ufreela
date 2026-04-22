from dataclasses import dataclass


@dataclass(frozen=True)
class RegisterUserCommand:
    email: str
    password: str
    confirm_password: str


@dataclass(frozen=True)
class RegisterUserResult:
    user_id: str
    email: str
