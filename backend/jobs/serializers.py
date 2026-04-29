from rest_framework import serializers

from .models import Category, Opportunity, Proposal, Skill


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["category_id", "category_name", "category_slug"]


class SkillSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Skill
        fields = ["skill_id", "skill_name", "skill_slug", "category"]


class OpportunityPublisherSerializer(serializers.Serializer):
    id = serializers.CharField()
    company_name = serializers.CharField(allow_blank=True)


class OpportunityListSerializer(serializers.ModelSerializer):
    publisher = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            "opportunity_id",
            "title",
            "description",
            "xp_level",
            "work_modality",
            "status",
            "budget_min",
            "budget_max",
            "created_at",
            "updated_at",
            "publisher",
            "category",
            "skills",
        ]

    def get_publisher(self, obj: Opportunity):
        return {
            "id": str(obj.publisher.user_id_id),
            "company_name": obj.publisher.company_name,
        }


class ProposalFreelancerSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
    profile_img = serializers.CharField(allow_null=True)
    professional_level = serializers.CharField(allow_blank=True)
    mean_eval = serializers.CharField()


class ProposalSerializer(serializers.ModelSerializer):
    opportunity = OpportunityListSerializer(read_only=True)
    freelancer = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            "proposal_id",
            "opportunity",
            "freelancer",
            "proposed_value",
            "cover_letter",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_freelancer(self, obj: Proposal):
        freelancer = obj.freelancer
        user = freelancer.user_id
        return {
            "id": str(user.id),
            "name": user.name,
            "last_name": user.last_name,
            "profile_img": user.profile_img.url if user.profile_img else None,
            "professional_level": freelancer.professional_level,
            "mean_eval": str(freelancer.mean_eval),
        }


class ProposalCreateSerializer(serializers.Serializer):
    proposed_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    cover_letter = serializers.CharField()

    def validate(self, attrs):
        attrs["cover_letter"] = attrs["cover_letter"].strip()

        if attrs["proposed_value"] <= 0:
            raise serializers.ValidationError(
                {"proposed_value": "Informe um valor de proposta maior que zero."}
            )

        if not attrs["cover_letter"]:
            raise serializers.ValidationError(
                {"cover_letter": "Informe uma mensagem para o publisher."}
            )

        return attrs

    def create(self, validated_data):
        return Proposal.objects.create(
            opportunity=self.context["opportunity"],
            freelancer=self.context["freelancer"],
            **validated_data,
        )


class ProposalStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ["status"]

    def validate_status(self, value):
        if value not in [Proposal.Status.ACCEPTED, Proposal.Status.REJECTED]:
            raise serializers.ValidationError("Status must be accepted or rejected.")
        return value


class OpportunityCreateSerializer(serializers.Serializer):
    category_id = serializers.IntegerField(required=False, allow_null=True)
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=True,
    )
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    xp_level = serializers.ChoiceField(
        choices=Opportunity.XpLevel.choices,
        required=False,
        allow_blank=True,
        default="",
    )
    work_modality = serializers.ChoiceField(
        choices=Opportunity.WorkModality.choices,
        required=False,
        allow_blank=True,
        default="",
    )
    budget_min = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    budget_max = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    status = serializers.ChoiceField(
        choices=Opportunity.Status.choices,
        required=False,
        default=Opportunity.Status.OPEN,
    )

    def validate(self, attrs):
        category_id = attrs.get("category_id")
        skill_ids = attrs.get("skill_ids", [])
        budget_min = attrs.get("budget_min")
        budget_max = attrs.get("budget_max")

        attrs["title"] = attrs["title"].strip()
        attrs["description"] = attrs["description"].strip()

        if not attrs["title"]:
            raise serializers.ValidationError({"title": "Informe o titulo da vaga."})

        if not attrs["description"]:
            raise serializers.ValidationError(
                {"description": "Informe a descricao da vaga."}
            )

        if budget_min is not None and budget_max is not None and budget_min > budget_max:
            raise serializers.ValidationError(
                {"budget_max": "O valor maximo deve ser maior ou igual ao minimo."}
            )

        if category_id is not None:
            try:
                attrs["category"] = Category.objects.get(pk=category_id)
            except Category.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"category_id": "Categoria informada nao existe."}
                ) from exc
        else:
            attrs["category"] = None

        unique_skill_ids = list(dict.fromkeys(skill_ids))
        skills = list(Skill.objects.filter(skill_id__in=unique_skill_ids))

        if len(skills) != len(unique_skill_ids):
            raise serializers.ValidationError(
                {"skill_ids": "Uma ou mais skills informadas nao existem."}
            )

        attrs["skill_ids"] = unique_skill_ids
        attrs["skills"] = skills
        return attrs

    def create(self, validated_data):
        publisher = self.context["publisher"]
        skills = validated_data.pop("skills", [])
        validated_data.pop("skill_ids", None)
        category = validated_data.pop("category", None)

        opportunity = Opportunity.objects.create(
            publisher=publisher,
            category=category,
            **validated_data,
        )
        if skills:
            opportunity.skills.set(skills)
        return opportunity
