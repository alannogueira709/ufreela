from unittest import TestCase

from users.application.dto.register_user import RegisterUserCommand
from users.application.use_cases.register_user import RegisterUserUseCase
from users.domain.exceptions import ConflictError, ValidationError


class FakeUser:
	def __init__(self, user_id: str, email: str):
		self.id = user_id
		self.email = email


class FakeUserRepository:
	def __init__(self):
		self._emails = set()
		self._counter = 1

	def email_exists(self, email: str) -> bool:
		return email in self._emails

	def create(self, email: str, password: str):
		self._emails.add(email)
		user = FakeUser(str(self._counter), email)
		self._counter += 1
		return user


class RegisterUserUseCaseTests(TestCase):
	def setUp(self):
		self.repo = FakeUserRepository()
		self.use_case = RegisterUserUseCase(user_repository=self.repo)

	def test_register_user_success(self):
		result = self.use_case.execute(
			RegisterUserCommand(
				email="USER@Example.com",
				password="Strong@123",
				confirm_password="Strong@123",
			)
		)

		self.assertEqual(result.user_id, "1")
		self.assertEqual(result.email, "user@example.com")

	def test_register_user_rejects_mismatched_passwords(self):
		with self.assertRaises(ValidationError):
			self.use_case.execute(
				RegisterUserCommand(
					email="user@example.com",
					password="Strong@123",
					confirm_password="Strong@124",
				)
			)

	def test_register_user_rejects_weak_password(self):
		with self.assertRaises(ValidationError):
			self.use_case.execute(
				RegisterUserCommand(
					email="user@example.com",
					password="weakpass",
					confirm_password="weakpass",
				)
			)

	def test_register_user_rejects_duplicate_email(self):
		self.use_case.execute(
			RegisterUserCommand(
				email="user@example.com",
				password="Strong@123",
				confirm_password="Strong@123",
			)
		)

		with self.assertRaises(ConflictError):
			self.use_case.execute(
				RegisterUserCommand(
					email="user@example.com",
					password="Strong@123",
					confirm_password="Strong@123",
				)
			)
