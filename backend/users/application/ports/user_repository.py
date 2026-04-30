from typing import Protocol


class UserRepositoryPort(Protocol):
    def email_exists(self, email: str) -> bool:
        ...

    def create(self, email: str, password: str):
        ...
