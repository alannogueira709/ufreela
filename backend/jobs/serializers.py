from rest_framework import serializers

from .models import Category, Opportunity, Skill


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
