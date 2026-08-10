import logging

from django.conf import settings
from django.db import connections
from django.core.cache import cache
from django.contrib.auth import logout as django_logout
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.text import slugify
from django.utils.decorators import method_decorator
from jobs.serializers import OpportunityListSerializer
from notifications.services import (
    ensure_profile_completion_notification,
    mark_profile_completion_notification_read,
)
from django.views.decorators.csrf import ensure_csrf_cookie
from jobs.models import FreelancerSkill, Opportunity, Skill
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from users.application.use_cases.register_user import RegisterUserUseCase
from users.domain.exceptions import ConflictError, ValidationError
from users.infrastructure.repositories.django_user_repository import \
    DjangoUserRepository

from .models import AuthCode, Freelancer, Publisher, User, SavedProfile
from .otp import AuthCodeService
from .serializers import (CustomTokenObtainPairSerializer,
                          FreelancerSkillUpdateSerializer,
                          OnboardingSerializer, RegisterSerializer,
                          SkillSerializer)
from .services import OnboardingService
from .throttles import (
    EmailVerificationConfirmRateThrottle,
    EmailVerificationRateThrottle,
    LoginRateThrottle,
    PasswordResetConfirmRateThrottle,
    PasswordResetRateThrottle,
    RefreshRateThrottle,
    RegisterRateThrottle,
)


def attach_auth_cookies(response, access: str, refresh: str):
    response.set_cookie(
        key=settings.AUTH_COOKIE_ACCESS,
        value=access,
        httponly=settings.AUTH_COOKIE_HTTPONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        domain=settings.AUTH_COOKIE_DOMAIN,
        path="/",
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
    )
    response.set_cookie(
        key=settings.AUTH_COOKIE_REFRESH,
        value=refresh,
        httponly=settings.AUTH_COOKIE_HTTPONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        domain=settings.AUTH_COOKIE_DOMAIN,
        path="/",
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
    )
    return response


def clear_auth_cookies(response: Response):
    response.delete_cookie(
        settings.AUTH_COOKIE_ACCESS,
        path="/",
        samesite=settings.AUTH_COOKIE_SAMESITE,
        domain=settings.AUTH_COOKIE_DOMAIN,
    )
    response.delete_cookie(
        settings.AUTH_COOKIE_REFRESH,
        path="/",
        samesite=settings.AUTH_COOKIE_SAMESITE,
        domain=settings.AUTH_COOKIE_DOMAIN,
    )
    response.delete_cookie("sessionid", path="/")
    response.delete_cookie("csrftoken", path="/")
    return response


def _blacklist_user_tokens(user: User) -> None:
    """Invalida todos os refresh tokens ativos do usuario."""
    try:
        for outstanding in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding)
    except Exception:
        logger = logging.getLogger("django")
        logger.exception("Erro ao invalidar tokens do usuario")


def get_frontend_redirect_url(user: User) -> str:
    path = "/register/complete" if not user.role else "/"
    return f"{settings.FRONTEND_URL}{path}"


@method_decorator(ensure_csrf_cookie, name="get")
class CsrfTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Garante que o navegador tenha um sessionid cookie antes de iniciar o
        # fluxo OAuth. O allauth precisa desse cookie para armazenar o state.
        if not request.session.session_key:
            request.session.save()
        return Response({"message": "CSRF cookie definido com sucesso."})


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code != status.HTTP_200_OK:
            return response

        access = response.data.get("access")
        refresh = response.data.get("refresh")

        if access and refresh:
            attach_auth_cookies(response, access, refresh)

        response.data = {"message": "Login realizado com sucesso."}
        return response


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RefreshRateThrottle]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not refresh_token:
            return Response(
                {"detail": "Refresh token ausente."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)

        access = serializer.validated_data["access"]
        rotated_refresh = serializer.validated_data.get("refresh", refresh_token)

        response = Response({"message": "Token renovado com sucesso."})
        return attach_auth_cookies(response, access, rotated_refresh)


class SocialLoginSuccessView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return redirect(f"{settings.FRONTEND_URL}/login?error=social_auth_failed")

        if not request.user.email_verified:
            request.user.email_verified = True
            request.user.email_verified_at = timezone.now()
            request.user.save(update_fields=["email_verified", "email_verified_at"])

        refresh = RefreshToken.for_user(request.user)
        response = redirect(get_frontend_redirect_url(request.user))
        attach_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class SocialSessionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"authenticated": False},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not request.user.email_verified:
            request.user.email_verified = True
            request.user.email_verified_at = timezone.now()
            request.user.save(update_fields=["email_verified", "email_verified_at"])

        refresh = RefreshToken.for_user(request.user)
        # Retorna apenas o caminho relativo (sem URL absoluta) para que o
        # frontend faca navegacao client-side (router.replace) sem trocar de
        # host -- trocar de host (ex: www -> sem www) causa full-page reload,
        # perdendo o estado do React Query e os cookies JWT recem-setados.
        redirect_path = "/register/complete" if not request.user.role else "/"
        response = Response({
            "authenticated": True,
            "redirect_url": redirect_path,
        })
        attach_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        checks = {
            "status": "ok",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "version": "1.0.0",
        }

        # Verifica conexão com o banco de dados
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                checks["database"] = "ok"
        except Exception as exc:
            checks["status"] = "degraded"
            checks["database"] = "error"
            import logging
            logging.getLogger("django").exception("Healthcheck DB error")

        # Verifica conexão com Redis (cache/sessões)
        try:
            from django.core.cache import cache
            cache.set("health_check", "ok", timeout=10)
            redis_value = cache.get("health_check")
            checks["redis"] = "ok" if redis_value == "ok" else "error: unexpected value"
        except Exception as exc:
            checks["status"] = "degraded"
            checks["redis"] = "error"
            import logging
            logging.getLogger("django").exception("Healthcheck Redis error")

        status_code = (
            status.HTTP_200_OK
            if checks["status"] == "ok"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(checks, status=status_code)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    use_case = RegisterUserUseCase(user_repository=DjangoUserRepository())

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = self.use_case.execute(serializer.to_command())
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ConflictError as e:
            # Mantem compatibilidade com o contrato anterior do endpoint.
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(pk=result.user_id)
        code = AuthCodeService.issue(user, AuthCode.Purpose.EMAIL_VERIFICATION)
        try:
            from core.email_service import EmailService

            EmailService().send_auth_code_email(
                user,
                code,
                AuthCode.Purpose.EMAIL_VERIFICATION,
            )
        except Exception:
            logging.getLogger("django").exception(
                "Erro ao enviar codigo de confirmacao de email"
            )

        return Response(
            {
                "message": "Conta criada. Enviamos um codigo para confirmar seu email.",
                "email": user.email,
                "email_verification_required": True,
            },
            status=status.HTTP_201_CREATED,
        )


class CompleteRegistrationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = OnboardingService.complete(request.user, serializer.to_dto())
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from core.email_service import EmailService
            email_service = EmailService()
            role = user.role.role_name if user.role else ""
            email_service.send_welcome_email(user, role=role)
        except Exception:
            import logging
            logger = logging.getLogger("django")
            logger.exception("Erro ao enviar email de boas-vindas")

        if user.role and user.role.role_name == "freelancer":
            ensure_profile_completion_notification(user)

        return Response({"message": "Cadastro finalizado."})


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)

        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass

        django_logout(request)

        response = Response({"message": "Logout realizado com sucesso."})
        return clear_auth_cookies(response)


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(self._serialize_user(request.user))

    def patch(self, request):
        user = request.user
        role = user.role.role_name if user.role else None
        profile_override = None

        if role == "freelancer":
            freelancer, _ = Freelancer.objects.get_or_create(user_id=user)
            if "hourly_rate" in request.data:
                freelancer.hourly_rate = request.data.get("hourly_rate") or None
            if "professional_level" in request.data:
                freelancer.professional_level = request.data.get("professional_level") or ""
            if "profile_title" in request.data:
                freelancer.profile_title = request.data.get("profile_title") or ""
            if "primary_area" in request.data:
                freelancer.primary_area = request.data.get("primary_area") or ""
            if "description" in request.data:
                freelancer.description = request.data.get("description") or ""
            freelancer.save()
            profile_override = freelancer

            if "skills" in request.data:
                skills = request.data.get("skills") or []
                self._replace_freelancer_skills(freelancer, skills)
                if skills:
                    mark_profile_completion_notification_read(user)

        elif role == "publisher":
            publisher, _ = Publisher.objects.get_or_create(user_id=user)
            if "company_name" in request.data:
                publisher.company_name = request.data.get("company_name") or ""
            if "company_document" in request.data:
                publisher.cnpj = request.data.get("company_document") or ""
            elif "cnpj" in request.data:
                publisher.cnpj = request.data.get("cnpj") or ""
            publisher.save()
            profile_override = publisher
        else:
            return Response({"error": "Perfil de usuario nao configurado."}, status=400)

        return Response(self._serialize_user(user, profile_override=profile_override))

    def _serialize_user(self, user, profile_override=None):
        first_name = (user.name or "").strip()
        last_name = (user.last_name or "").strip()
        display_name = " ".join(filter(None, [first_name, last_name]))

        if not display_name:
            display_name = (user.email or "").split("@")[0]

        payload = {
            "id": user.id,
            "email": user.email,
            "first_name": first_name,
            "last_name": last_name,
            "display_name": display_name,
            "role": user.role.role_name if user.role else None,
            "profile_img": user.profile_img.url if user.profile_img else None,
        }

        if payload["role"] == "freelancer" and (
            profile_override is not None or hasattr(user, "freelancer_profile")
        ):
            freelancer = profile_override or user.freelancer_profile
            payload.update(
                {
                    "hourly_rate": str(freelancer.hourly_rate) if freelancer.hourly_rate else None,
                    "professional_level": freelancer.professional_level,
                    "profile_title": freelancer.profile_title,
                    "primary_area": freelancer.primary_area,
                    "description": freelancer.description,
                    "skills": [
                        {
                            "name": item.skill.skill_name,
                            "level": item.skill_level,
                        }
                        for item in freelancer.skills.select_related("skill").all()
                    ],
                }
            )

        if payload["role"] == "publisher" and (
            profile_override is not None or hasattr(user, "publisher_profile")
        ):
            publisher = profile_override or user.publisher_profile
            payload.update(
                {
                    "company_name": publisher.company_name,
                    "company_document": publisher.cnpj,
                }
            )

        return payload

    def _replace_freelancer_skills(self, freelancer, skills):
        FreelancerSkill.objects.filter(freelancer=freelancer).delete()
        for item in skills:
            if isinstance(item, str):
                name = item.strip()
                level = FreelancerSkill.SkillLevel.INTERMEDIATE
            else:
                name = str(item.get("name", "")).strip()
                level = item.get("level") or FreelancerSkill.SkillLevel.INTERMEDIATE

            if not name:
                continue

            skill, _ = Skill.objects.get_or_create(
                skill_slug=slugify(name),
                defaults={"skill_name": name},
            )
            FreelancerSkill.objects.update_or_create(
                freelancer=freelancer,
                skill=skill,
                defaults={"skill_level": level},
            )


class SkillListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        skills = Skill.objects.select_related("category").all()
        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data)


class FreelancerSkillsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if (
            not getattr(request.user, "role", None)
            or request.user.role.role_name != "freelancer"
        ):
            return Response(
                {"error": "Acesso negado. Apenas freelancers podem adicionar skills."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = FreelancerSkillUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            freelancer = request.user.freelancer_profile
        except Freelancer.DoesNotExist:
            return Response(
                {"error": "Perfil de freelancer não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        FreelancerSkill.objects.filter(freelancer=freelancer).delete()

        skills_data = serializer.validated_data.get("skills", [])
        new_skills = []
        for item in skills_data:
            new_skills.append(
                FreelancerSkill(
                    freelancer=freelancer,
                    skill_id=item["skill_id"],
                    skill_level=item["skill_level"],
                )
            )

        FreelancerSkill.objects.bulk_create(new_skills)
        mark_profile_completion_notification_read(request.user)

        return Response({"message": "Habilidades cadastradas com sucesso!"})


class FeaturedFreelancersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        freelancers = (
            Freelancer.objects.select_related("user_id")
            .order_by("-mean_eval", "-finished_jobs")[:12]
        )

        payload = []
        for freelancer in freelancers:
            user = freelancer.user_id
            payload.append(
                {
                    "id": str(user.id),
                    "name": user.name,
                    "last_name": user.last_name,
                    "profile_img": user.profile_img.url if user.profile_img else None,
                    "professional_level": freelancer.professional_level,
                    "hourly_rate": (
                        str(freelancer.hourly_rate)
                        if freelancer.hourly_rate is not None
                        else None
                    ),
                    "mean_eval": str(freelancer.mean_eval),
                    "finished_jobs": freelancer.finished_jobs,
                }
            )

        return Response(payload)


class FeaturedOpportunitiesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        opportunities = (
            Opportunity.objects.select_related("publisher__user_id", "category")
            .prefetch_related("skills__category")
            .order_by("-created_at")[:12]
        )
        serializer = OpportunityListSerializer(opportunities, many=True)
        return Response(serializer.data)


class PublisherProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id: str):
        try:
            publisher = Publisher.objects.select_related("user_id").get(user_id=user_id)
        except Publisher.DoesNotExist:
            return Response(
                {"error": "Perfil de empreendedor não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = publisher.user_id
        is_saved = False
        if request.user.is_authenticated:
            is_saved = SavedProfile.objects.filter(
                user=request.user,
                saved_user=user,
            ).exists()

        opportunities = (
            Opportunity.objects.filter(publisher=publisher)
            .select_related("publisher__user_id", "category")
            .prefetch_related("skills__category")
            .order_by("-created_at")[:6]
        )
        return Response(
            {
                "id": str(user.id),
                "name": user.name,
                "last_name": user.last_name,
                "profile_img": user.profile_img.url if user.profile_img else None,
                "company_name": publisher.company_name,
                "mean_eval": str(publisher.mean_eval),
                "is_saved": is_saved,
                "opportunities": OpportunityListSerializer(opportunities, many=True).data,
            }
        )


class FreelancerProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id: str):
        try:
            freelancer = Freelancer.objects.select_related("user_id").get(user_id=user_id)
        except Freelancer.DoesNotExist:
            return Response(
                {"error": "Perfil de freelancer não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = freelancer.user_id
        is_saved = False
        if request.user.is_authenticated:
            is_saved = SavedProfile.objects.filter(
                user=request.user,
                saved_user=user,
            ).exists()

        skills = (
            FreelancerSkill.objects.filter(freelancer=freelancer)
            .select_related("skill__category")
            .order_by("skill__skill_name")
        )
        return Response(
            {
                "id": str(user.id),
                "name": user.name,
                "last_name": user.last_name,
                "profile_img": user.profile_img.url if user.profile_img else None,
                    "description": freelancer.description,
                    "profile_title": freelancer.profile_title,
                    "primary_area": freelancer.primary_area,
                    "professional_level": freelancer.professional_level,
                "hourly_rate": str(freelancer.hourly_rate) if freelancer.hourly_rate is not None else None,
                "mean_eval": str(freelancer.mean_eval),
                "finished_jobs": freelancer.finished_jobs,
                "is_saved": is_saved,
                "skills": [
                    {
                        "skill_id": item.skill.skill_id,
                        "skill_name": item.skill.skill_name,
                        "skill_slug": item.skill.skill_slug,
                        "skill_level": item.skill_level,
                        "category": {
                            "category_id": item.skill.category.category_id,
                            "category_name": item.skill.category.category_name,
                            "category_slug": item.skill.category.category_slug,
                        }
                        if item.skill.category
                        else None,
                    }
                    for item in skills
                ],
            }
        )


class SaveProfileToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id: str):
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if target_user == request.user:
            return Response(
                {"error": "Você não pode salvar o seu próprio perfil."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        saved, created = SavedProfile.objects.get_or_create(
            user=request.user,
            saved_user=target_user,
        )

        if not created:
            saved.delete()
            return Response({"saved": False}, status=status.HTTP_200_OK)

        return Response({"saved": True}, status=status.HTTP_201_CREATED)

    def get(self, request, user_id: str):
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_saved = SavedProfile.objects.filter(
            user=request.user,
            saved_user=target_user,
        ).exists()

        return Response({"saved": is_saved}, status=status.HTTP_200_OK)


class EmailVerificationRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [EmailVerificationRateThrottle]

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"error": "O campo email é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if user and not user.email_verified:
            code = AuthCodeService.issue(user, AuthCode.Purpose.EMAIL_VERIFICATION)
            try:
                from core.email_service import EmailService

                EmailService().send_auth_code_email(
                    user,
                    code,
                    AuthCode.Purpose.EMAIL_VERIFICATION,
                )
            except Exception:
                logging.getLogger("django").exception(
                    "Erro ao reenviar codigo de confirmacao de email"
                )

        return Response(
            {
                "message": (
                    "Se houver uma conta pendente de confirmação para este email, "
                    "um novo código foi enviado."
                )
            }
        )


class EmailVerificationConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [EmailVerificationConfirmRateThrottle]

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        code = str(request.data.get("code") or "").strip()

        if not email or len(code) != 6 or not code.isdigit():
            return Response(
                {"error": "Informe um email e um código de 6 dígitos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if user is None or user.email_verified:
            if user and user.email_verified:
                return Response({"message": "Email já confirmado."})
            return Response(
                {"error": "Código inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not AuthCodeService.consume(
            email,
            AuthCode.Purpose.EMAIL_VERIFICATION,
            code,
        ):
            return Response(
                {"error": "Código inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email_verified = True
        user.email_verified_at = timezone.now()
        user.save(update_fields=["email_verified", "email_verified_at"])
        return Response({"message": "Email confirmado com sucesso."})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"error": "O campo email é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if user:
            code = AuthCodeService.issue(user, AuthCode.Purpose.PASSWORD_RESET)
            try:
                from core.email_service import EmailService

                EmailService().send_auth_code_email(
                    user,
                    code,
                    AuthCode.Purpose.PASSWORD_RESET,
                )
            except Exception:
                logging.getLogger("django").exception(
                    "Erro ao enviar codigo de reset de senha"
                )

        return Response(
            {
                "message": (
                    "Se o e-mail informado estiver cadastrado, um código de "
                    "redefinição foi enviado."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetConfirmRateThrottle]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        new_password = request.data.get("new_password")

        if email is not None or code is not None:
            email = str(email or "").strip().lower()
            code = str(code or "").strip()

            if not email or len(code) != 6 or not code.isdigit() or not new_password:
                return Response(
                    {"error": "Email, código e nova senha são obrigatórios."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            from django.contrib.auth.password_validation import validate_password
            from django.core.exceptions import ValidationError as DjangoValidationError

            try:
                user = User.objects.get(email__iexact=email)
                validate_password(new_password, user)
            except User.DoesNotExist:
                return Response(
                    {"error": "Código inválido ou expirado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except DjangoValidationError as e:
                return Response(
                    {"error": e.messages},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not AuthCodeService.consume(
                email,
                AuthCode.Purpose.PASSWORD_RESET,
                code,
            ):
                return Response(
                    {"error": "Código inválido ou expirado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(new_password)
            user.save(update_fields=["password", "updated_at"])
            _blacklist_user_tokens(user)
            return Response(
                {"message": "Senha redefinida com sucesso!"},
                status=status.HTTP_200_OK,
            )

        # Mantém a confirmação por link durante a transição para OTP.
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        uidb64 = request.data.get("uidb64")
        token = request.data.get("token")

        if not uidb64 or not token or not new_password:
            return Response(
                {"error": "Os campos uidb64, token e new_password são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Link de redefinição inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Link de redefinição inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response(
                {"error": e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        _blacklist_user_tokens(user)

        return Response(
            {"message": "Senha redefinida com sucesso!"},
            status=status.HTTP_200_OK
        )


class UserDataExportView(APIView):
    """LGPD: export all personal data belonging to the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        data = {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "name": user.name,
                "last_name": user.last_name,
                "role": user.role.role_name if user.role else None,
                "is_active": user.is_active,
                "date_joined": user.date_joined.isoformat() if user.date_joined else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
            },
            "social_accounts": [],
            "profile": {},
            "saved_profiles": [],
        }

        try:
            freelancer = user.freelancer_profile
            data["profile"]["freelancer"] = {
                "description": freelancer.description,
                "professional_level": freelancer.professional_level,
                "hourly_rate": str(freelancer.hourly_rate) if freelancer.hourly_rate else None,
                "finished_jobs": freelancer.finished_jobs,
                "mean_eval": str(freelancer.mean_eval),
            }
        except (Freelancer.DoesNotExist, AttributeError):
            pass

        try:
            publisher = user.publisher_profile
            data["profile"]["publisher"] = {
                "company_name": publisher.company_name,
                "description": publisher.description,
                "website": publisher.website,
            }
        except (Publisher.DoesNotExist, AttributeError):
            pass

        for account in user.socialaccount_set.all():
            data["social_accounts"].append({
                "provider": account.provider,
                "uid": account.uid,
                "extra_data": account.extra_data,
                "last_login": account.last_login.isoformat() if account.last_login else None,
            })

        for saved in SavedProfile.objects.filter(user=user):
            data["saved_profiles"].append(str(saved.saved_user_id))

        return Response({"data": data})


class UserDeleteAccountView(APIView):
    """LGPD: anonymize/delete the authenticated user's account."""

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user

        # Remove connected social accounts first to avoid orphaned data.
        user.socialaccount_set.all().delete()

        # Anonymize personal identifiers.
        import uuid
        anonymous_suffix = uuid.uuid4().hex[:12]
        user.email = f"deleted_{anonymous_suffix}@anon.ufreela"
        user.username = f"deleted_{anonymous_suffix}"
        user.name = "Usuário excluído"
        user.last_name = ""
        user.is_active = False
        user.set_unusable_password()

        if user.profile_img:
            user.profile_img.delete(save=False)
            user.profile_img = None

        user.save()
        _blacklist_user_tokens(user)

        response = Response(
            {"message": "Conta excluída com sucesso."},
            status=status.HTTP_200_OK,
        )
        return clear_auth_cookies(response)
