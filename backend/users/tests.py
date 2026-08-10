import re
from unittest import TestCase

from django.test import TestCase as DjangoTestCase
from rest_framework.test import APIClient

from jobs.models import FreelancerSkill, Skill
from users.application.dto.register_user import RegisterUserCommand
from users.application.use_cases.register_user import RegisterUserUseCase
from users.domain.exceptions import ConflictError, ValidationError
from users.models import AuthCode, Freelancer, Publisher, Role, User


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


class UserMeApiTests(DjangoTestCase):
	def setUp(self):
		self.client = APIClient()
		self.freelancer_role, _ = Role.objects.get_or_create(role_name="freelancer")
		self.publisher_role, _ = Role.objects.get_or_create(role_name="publisher")

	def test_patch_updates_freelancer_profile(self):
		user = User.objects.create_user(
			email="freelancer-profile@example.com",
			username="freelancer-profile",
			password="secret123",
			role=self.freelancer_role,
		)
		Freelancer.objects.create(user_id=user)
		self.client.force_authenticate(user)

		response = self.client.patch(
			"/api/auth/me/",
			{
				"hourly_rate": 150,
				"professional_level": "senior",
				"profile_title": "Backend Developer",
				"primary_area": "Desenvolvimento",
				"description": "Backend developer",
				"skills": [{"name": "Django", "level": "advanced"}],
			},
			format="json",
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["professional_level"], "senior")
		self.assertEqual(response.json()["profile_title"], "Backend Developer")
		self.assertEqual(response.json()["primary_area"], "Desenvolvimento")
		self.assertEqual(Freelancer.objects.get(user_id=user).hourly_rate, 150)
		self.assertTrue(Skill.objects.filter(skill_slug="django").exists())
		self.assertEqual(FreelancerSkill.objects.count(), 1)

	def test_patch_updates_publisher_profile(self):
		user = User.objects.create_user(
			email="publisher-profile@example.com",
			username="publisher-profile",
			password="secret123",
			role=self.publisher_role,
		)
		Publisher.objects.create(user_id=user)
		self.client.force_authenticate(user)

		response = self.client.patch(
			"/api/auth/me/",
			{
				"company_name": "Acme LTDA",
				"company_document": "12345678000190",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["company_name"], "Acme LTDA")
		publisher = Publisher.objects.get(user_id=user)
		self.assertEqual(publisher.company_name, "Acme LTDA")
		self.assertEqual(publisher.cnpj, "12345678000190")


class PublicProfileSaveApiTests(DjangoTestCase):
	def setUp(self):
		self.client = APIClient()
		self.freelancer_role, _ = Role.objects.get_or_create(role_name="freelancer")
		self.publisher_role, _ = Role.objects.get_or_create(role_name="publisher")
		self.viewer = User.objects.create_user(
			email="viewer@example.com",
			username="viewer",
			password="secret123",
			role=self.freelancer_role,
		)
		Freelancer.objects.create(user_id=self.viewer)
		self.publisher_user = User.objects.create_user(
			email="saved-publisher@example.com",
			username="saved-publisher",
			password="secret123",
			role=self.publisher_role,
		)
		Publisher.objects.create(user_id=self.publisher_user, company_name="Saved Co")

	def test_can_toggle_saved_profile(self):
		self.client.force_authenticate(self.viewer)

		first_response = self.client.post(f"/api/profile/save/{self.publisher_user.id}/")
		second_response = self.client.post(f"/api/profile/save/{self.publisher_user.id}/")

		self.assertEqual(first_response.status_code, 201)
		self.assertTrue(first_response.json()["saved"])
		self.assertEqual(second_response.status_code, 200)
		self.assertFalse(second_response.json()["saved"])

	def test_publisher_profile_includes_saved_state(self):
		self.client.force_authenticate(self.viewer)
		self.client.post(f"/api/profile/save/{self.publisher_user.id}/")

		response = self.client.get(f"/api/profile/publisher/{self.publisher_user.id}/")

		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.json()["is_saved"])


class EmailVerificationApiTests(DjangoTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_requires_email_confirmation_before_login(self):
        from django.core import mail

        register_response = self.client.post(
            "/api/auth/register/",
            {
                "email": "verify-me@example.com",
                "password": "Strong@123",
                "confirm_password": "Strong@123",
            },
            format="json",
        )
        self.assertEqual(register_response.status_code, 201)
        self.assertFalse(User.objects.get(email="verify-me@example.com").email_verified)

        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "verify-me@example.com", "password": "Strong@123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 400)
        self.assertEqual(login_response.json()["code"][0], "email_not_verified")

        code = re.search(r"\b\d{6}\b", mail.outbox[0].body).group()
        confirm_response = self.client.post(
            "/api/auth/email/verify/confirm/",
            {"email": "verify-me@example.com", "code": code},
            format="json",
        )
        self.assertEqual(confirm_response.status_code, 200)
        self.assertTrue(User.objects.get(email="verify-me@example.com").email_verified)

        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "verify-me@example.com", "password": "Strong@123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 200)

    def test_expired_email_code_is_rejected(self):
        user = User.objects.create_user(
            email="expired-code@example.com",
            username="expired-code",
            password="Strong@123",
        )
        from users.otp import AuthCodeService
        from django.utils import timezone
        from datetime import timedelta

        code = AuthCodeService.issue(user, AuthCode.Purpose.EMAIL_VERIFICATION)
        AuthCode.objects.filter(user=user).update(
            expires_at=timezone.now() - timedelta(minutes=1)
        )

        response = self.client.post(
            "/api/auth/email/verify/confirm/",
            {"email": user.email, "code": code},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        user.refresh_from_db()
        self.assertFalse(user.email_verified)


class PasswordResetApiTests(DjangoTestCase):
    def setUp(self):
        self.client = APIClient()
        self.role, _ = Role.objects.get_or_create(role_name="freelancer")
        self.user = User.objects.create_user(
            email="reset-me@example.com",
            username="resetme",
            password="OldPassword123!",
            role=self.role,
        )

    def test_password_reset_request_sends_email(self):
        from django.core import mail

        response = self.client.post(
            "/api/auth/password/reset/",
            {"email": "reset-me@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("código", mail.outbox[0].body.lower())
        self.assertRegex(mail.outbox[0].body, r"\b\d{6}\b")

    def test_password_reset_confirm_with_code(self):
        from django.core import mail

        self.client.post(
            "/api/auth/password/reset/",
            {"email": self.user.email},
            format="json",
        )
        code = re.search(r"\b\d{6}\b", mail.outbox[0].body).group()

        response = self.client.post(
            "/api/auth/password/reset/confirm/",
            {
                "email": self.user.email,
                "code": code,
                "new_password": "NewSecurePassword123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))

    def test_password_reset_confirm_successful(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            "/api/auth/password/reset/confirm/",
            {
                "uidb64": uidb64,
                "token": token,
                "new_password": "NewSecurePassword123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))

    def test_password_reset_confirm_invalid_token(self):
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))

        response = self.client.post(
            "/api/auth/password/reset/confirm/",
            {
                "uidb64": uidb64,
                "token": "invalid-token",
                "new_password": "NewSecurePassword123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
