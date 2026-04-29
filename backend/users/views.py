from django.conf import settings
from django.contrib.auth import logout as django_logout
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from jobs.serializers import OpportunityListSerializer
from django.views.decorators.csrf import ensure_csrf_cookie
from jobs.models import FreelancerSkill, Opportunity, Skill
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from users.application.use_cases.register_user import RegisterUserUseCase
from users.domain.exceptions import ConflictError, ValidationError
from users.infrastructure.repositories.django_user_repository import \
    DjangoUserRepository

from .models import Freelancer, Publisher, User, SavedProfile
from .serializers import (CustomTokenObtainPairSerializer,
                          FreelancerSkillUpdateSerializer,
                          OnboardingSerializer, RegisterSerializer,
                          SkillSerializer)
from .services import OnboardingService


def attach_auth_cookies(response, access: str, refresh: str):
    response.set_cookie(
        key=settings.AUTH_COOKIE_ACCESS,
        value=access,
        httponly=settings.AUTH_COOKIE_HTTP_ONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
    )
    response.set_cookie(
        key=settings.AUTH_COOKIE_REFRESH,
        value=refresh,
        httponly=settings.AUTH_COOKIE_HTTP_ONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
    )
    return response


def clear_auth_cookies(response: Response):
    response.delete_cookie(
        settings.AUTH_COOKIE_ACCESS,
        path="/",
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.AUTH_COOKIE_REFRESH,
        path="/",
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    response.delete_cookie("sessionid", path="/")
    response.delete_cookie("csrftoken", path="/")
    return response


def get_frontend_redirect_url(user: User) -> str:
    path = "/register/complete" if not user.role else "/"
    return f"{settings.FRONTEND_URL}{path}"


@method_decorator(ensure_csrf_cookie, name="get")
class CsrfTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "CSRF cookie definido com sucesso."})


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
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

        refresh = RefreshToken.for_user(request.user)
        response = redirect(get_frontend_redirect_url(request.user))
        attach_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    use_case = RegisterUserUseCase(user_repository=DjangoUserRepository())

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.use_case.execute(serializer.to_command())
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ConflictError as e:
            # Mantem compatibilidade com o contrato anterior do endpoint.
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"message": "Usuário criado com sucesso."},
            status=status.HTTP_201_CREATED,
        )


class CompleteRegistrationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            OnboardingService.complete(request.user, serializer.to_dto())
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        user = request.user
        first_name = (user.name or "").strip()
        last_name = (user.last_name or "").strip()
        display_name = " ".join(filter(None, [first_name, last_name]))

        if not display_name:
            display_name = (user.email or "").split("@")[0]

        return Response(
            {
                "id": user.id,
                "email": user.email,
                "first_name": first_name,
                "last_name": last_name,
                "display_name": display_name,
                "role": user.role.role_name if user.role else None,
                "profile_img": user.profile_img.url if user.profile_img else None,
            }
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
                    "email": user.email,
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
        opportunities = (
            Opportunity.objects.filter(publisher=publisher)
            .select_related("publisher__user_id", "category")
            .prefetch_related("skills__category")
            .order_by("-created_at")[:6]
        )
        return Response(
            {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "last_name": user.last_name,
                "profile_img": user.profile_img.url if user.profile_img else None,
                "company_name": publisher.company_name,
                "mean_eval": str(publisher.mean_eval),
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
        skills = (
            FreelancerSkill.objects.filter(freelancer=freelancer)
            .select_related("skill__category")
            .order_by("skill__skill_name")
        )
        return Response(
            {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "last_name": user.last_name,
                "profile_img": user.profile_img.url if user.profile_img else None,
                "description": freelancer.description,
                "professional_level": freelancer.professional_level,
                "hourly_rate": str(freelancer.hourly_rate) if freelancer.hourly_rate is not None else None,
                "mean_eval": str(freelancer.mean_eval),
                "finished_jobs": freelancer.finished_jobs,
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
