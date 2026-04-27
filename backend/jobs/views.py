from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import Freelancer, Publisher

from .models import Category, Opportunity, Proposal, Skill
from .serializers import (
    CategorySerializer,
    OpportunityCreateSerializer,
    OpportunityListSerializer,
    ProposalCreateSerializer,
    ProposalSerializer,
    SkillSerializer,
)


def _is_int_like(value: str | None) -> bool:
    return bool(value) and value.isdigit()


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.order_by("category_name")
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class SkillListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Skill.objects.select_related("category").order_by("skill_name")
        category = request.query_params.get("category")

        if category:
            queryset = queryset.filter(
                Q(category__category_slug=category) | Q(category__category_id=category)
            )

        serializer = SkillSerializer(queryset, many=True)
        return Response(serializer.data)


class OpportunityListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        queryset = (
            Opportunity.objects.select_related("publisher__user_id", "category")
            .prefetch_related("skills__category")
            .order_by("-created_at")
        )

        q = request.query_params.get("q", "").strip()
        category = request.query_params.get("category")
        skill = request.query_params.get("skill")
        publisher = request.query_params.get("publisher")
        xp_level = request.query_params.get("xp_level")
        work_modality = request.query_params.get("work_modality")
        status_param = request.query_params.get("status")

        if q:
            queryset = queryset.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(publisher__company_name__icontains=q)
            )

        if category:
            category_filters = Q(category__category_slug=category)
            if _is_int_like(category):
                category_filters |= Q(category__category_id=int(category))
            queryset = queryset.filter(category_filters)

        if skill:
            skill_filters = Q(skills__skill_slug=skill)
            if _is_int_like(skill):
                skill_filters |= Q(skills__skill_id=int(skill))
            queryset = queryset.filter(skill_filters)

        if publisher:
            queryset = queryset.filter(publisher__user_id_id=publisher)

        if xp_level:
            queryset = queryset.filter(xp_level=xp_level)

        if work_modality:
            queryset = queryset.filter(work_modality=work_modality)

        if status_param and status_param != "all":
            queryset = queryset.filter(status=status_param)
        elif not status_param:
            queryset = queryset.filter(status=Opportunity.Status.OPEN)

        serializer = OpportunityListSerializer(queryset.distinct(), many=True)
        return Response(serializer.data)

    def post(self, request):
        if (
            not getattr(request.user, "role", None)
            or request.user.role.role_name != "publisher"
        ):
            return Response(
                {"error": "Apenas publishers podem criar oportunidades."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            publisher = request.user.publisher_profile
        except Publisher.DoesNotExist:
            return Response(
                {"error": "Perfil de publisher nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OpportunityCreateSerializer(
            data=request.data,
            context={"publisher": publisher},
        )
        serializer.is_valid(raise_exception=True)
        opportunity = serializer.save()

        response_serializer = OpportunityListSerializer(opportunity)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class OpportunityDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, opportunity_id: int):
        try:
            opportunity = (
                Opportunity.objects.select_related("publisher__user_id", "category")
                .prefetch_related("skills__category")
                .get(pk=opportunity_id)
            )
        except Opportunity.DoesNotExist:
            return Response(
                {"error": "Oportunidade nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OpportunityListSerializer(opportunity)
        return Response(serializer.data)


class OpportunityProposalCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, opportunity_id: int):
        if (
            not getattr(request.user, "role", None)
            or request.user.role.role_name != "freelancer"
        ):
            return Response(
                {"error": "Apenas freelancers podem enviar propostas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            freelancer = request.user.freelancer_profile
        except Freelancer.DoesNotExist:
            return Response(
                {"error": "Perfil de freelancer nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            opportunity = Opportunity.objects.get(pk=opportunity_id)
        except Opportunity.DoesNotExist:
            return Response(
                {"error": "Oportunidade nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if opportunity.status != Opportunity.Status.OPEN:
            return Response(
                {"error": "Esta oportunidade nao esta aberta para propostas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Proposal.objects.filter(
            opportunity=opportunity,
            freelancer=freelancer,
        ).exists():
            return Response(
                {"error": "Voce ja enviou uma proposta para esta oportunidade."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProposalCreateSerializer(
            data=request.data,
            context={"opportunity": opportunity, "freelancer": freelancer},
        )
        serializer.is_valid(raise_exception=True)
        proposal = serializer.save()

        response_serializer = ProposalSerializer(proposal)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class FreelancerProposalListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if (
            not getattr(request.user, "role", None)
            or request.user.role.role_name != "freelancer"
        ):
            return Response(
                {"error": "Apenas freelancers podem acessar suas propostas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            freelancer = request.user.freelancer_profile
        except Freelancer.DoesNotExist:
            return Response(
                {"error": "Perfil de freelancer nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        proposals = (
            Proposal.objects.filter(freelancer=freelancer)
            .select_related(
                "freelancer__user_id",
                "opportunity__publisher__user_id",
                "opportunity__category",
            )
            .prefetch_related("opportunity__skills__category")
            .order_by("-created_at")
        )
        serializer = ProposalSerializer(proposals, many=True)
        return Response(serializer.data)


class PublisherProposalListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if (
            not getattr(request.user, "role", None)
            or request.user.role.role_name != "publisher"
        ):
            return Response(
                {"error": "Apenas publishers podem acessar propostas recebidas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            publisher = request.user.publisher_profile
        except Publisher.DoesNotExist:
            return Response(
                {"error": "Perfil de publisher nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        proposals = (
            Proposal.objects.filter(opportunity__publisher=publisher)
            .select_related(
                "freelancer__user_id",
                "opportunity__publisher__user_id",
                "opportunity__category",
            )
            .prefetch_related("opportunity__skills__category")
            .order_by("-created_at")
        )
        serializer = ProposalSerializer(proposals, many=True)
        return Response(serializer.data)
