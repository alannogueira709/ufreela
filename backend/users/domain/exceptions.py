class DomainError(Exception):
    """Base exception for business rule violations in the users domain."""


class ValidationError(DomainError):
    pass


class ConflictError(DomainError):
    pass
