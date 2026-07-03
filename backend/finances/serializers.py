from rest_framework import serializers

from .models import Contract, PaymentMethod, StripeAccount, Transaction


class StripeAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = StripeAccount
        fields = [
            "id",
            "stripe_account_id",
            "status",
            "charges_enabled",
            "payouts_enabled",
            "requirements_due",
            "country",
            "currency",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ["id", "type", "last4", "brand", "is_default", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class TransactionSerializer(serializers.ModelSerializer):
    freelancer_name = serializers.CharField(source="freelancer.get_full_name", read_only=True)
    publisher_name = serializers.CharField(source="publisher.get_full_name", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "stripe_payment_intent_id",
            "publisher",
            "freelancer",
            "freelancer_name",
            "publisher_name",
            "job_id",
            "amount",
            "platform_fee",
            "freelancer_amount",
            "type",
            "status",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class DashboardContractSerializer(serializers.ModelSerializer):
    proposal_id = serializers.IntegerField(source="proposal.proposal_id", read_only=True)
    opportunity_id = serializers.IntegerField(source="proposal.opportunity.opportunity_id", read_only=True)
    opportunity_title = serializers.CharField(source="proposal.opportunity.title", read_only=True)
    publisher_id = serializers.UUIDField(source="proposal.opportunity.publisher.user_id_id", read_only=True)
    publisher_name = serializers.CharField(source="proposal.opportunity.publisher.company_name", read_only=True)
    freelancer_id = serializers.UUIDField(source="proposal.freelancer.user_id_id", read_only=True)
    freelancer_name = serializers.SerializerMethodField()
    proposed_value = serializers.DecimalField(
        source="proposal.proposed_value",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Contract
        fields = [
            "contract_id",
            "proposal_id",
            "opportunity_id",
            "opportunity_title",
            "publisher_id",
            "publisher_name",
            "freelancer_id",
            "freelancer_name",
            "proposed_value",
            "total_value",
            "status",
            "start_date",
            "end_date",
            "freelancer_completion_approved",
            "publisher_completion_approved",
            "completed_at",
            "escrow_released_at",
            "created_at",
            "updated_at",
        ]

    def get_freelancer_name(self, obj):
        user = obj.proposal.freelancer.user_id
        return " ".join(part for part in [user.name, user.last_name] if part).strip() or user.email
