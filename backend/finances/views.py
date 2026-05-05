from decimal import Decimal
from uuid import UUID

from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from jobs.models import Opportunity
from users.models import User

from .models import Contract, StripeAccount, Transaction
from .serializers import DashboardContractSerializer, StripeAccountSerializer, TransactionSerializer

try:
    import stripe
except ImportError:  # pragma: no cover - exercised only when dependency is missing locally.
    stripe = None


def _stripe():
    if stripe is None:
        raise RuntimeError("stripe package is not installed")
    if not settings.STRIPE_SECRET_KEY:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured")
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_connect_account(request):
    user = request.user
    if hasattr(user, "stripe_account"):
        return Response({"error": "Account already exists"}, status=400)

    try:
        stripe_client = _stripe()
        account = stripe_client.Account.create(
            type="express",
            country=request.data.get("country", "BR"),
            email=user.email,
            capabilities={
                "transfers": {"requested": True},
                "card_payments": {"requested": True},
            },
            business_type="individual",
            metadata={"user_id": str(user.id), "platform": "freela"},
        )

        stripe_account = StripeAccount.objects.create(
            user=user,
            stripe_account_id=account.id,
            country=account.country,
            currency="brl" if account.country == "BR" else "usd",
        )

        account_link = stripe_client.AccountLink.create(
            account=account.id,
            refresh_url=f"{settings.FRONTEND_URL}/settings?tab=billing&error=true",
            return_url=f"{settings.FRONTEND_URL}/settings?tab=billing&success=true",
            type="account_onboarding",
        )

        return Response(
            {
                "account": StripeAccountSerializer(stripe_account).data,
                "onboarding_url": account_link.url,
            }
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=400)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_account(request):
    try:
        account = request.user.stripe_account
    except StripeAccount.DoesNotExist:
        return Response({"error": "No account found"}, status=404)

    try:
        stripe_acc = _stripe().Account.retrieve(account.stripe_account_id)
        requirements = getattr(stripe_acc, "requirements", None)
        currently_due = getattr(requirements, "currently_due", []) if requirements else []
        account.charges_enabled = bool(stripe_acc.charges_enabled)
        account.payouts_enabled = bool(stripe_acc.payouts_enabled)
        account.requirements_due = list(currently_due)
        account.status = (
            StripeAccount.Status.ACTIVE
            if account.charges_enabled and account.payouts_enabled
            else StripeAccount.Status.PENDING
        )
        account.save()
    except Exception:
        pass

    return Response(StripeAccountSerializer(account).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    job_id = request.data.get("job_id")
    freelancer_id = request.data.get("freelancer_id")

    try:
        amount = int(request.data.get("amount", 0))
    except (TypeError, ValueError):
        return Response({"error": "Invalid amount"}, status=400)

    if amount <= 0:
        return Response({"error": "Invalid amount"}, status=400)

    if not freelancer_id:
        return Response({"error": "freelancer_id is required"}, status=400)

    try:
        freelancer_uuid = UUID(str(freelancer_id))
    except (TypeError, ValueError):
        return Response({"error": "Invalid freelancer_id"}, status=400)

    if not User.objects.filter(pk=freelancer_uuid).exists():
        return Response({"error": "Freelancer not found"}, status=404)

    normalized_job_id = str(job_id) if job_id not in (None, "") else None
    if job_id not in (None, ""):
        try:
            opportunity_id = int(job_id)
        except (TypeError, ValueError):
            return Response({"error": "Invalid job_id"}, status=400)

        if not Opportunity.objects.filter(pk=opportunity_id).exists():
            return Response({"error": "Opportunity not found"}, status=404)

    try:
        freelancer_account = StripeAccount.objects.get(
            user_id=freelancer_uuid,
            charges_enabled=True,
        )
    except StripeAccount.DoesNotExist:
        return Response({"error": "Freelancer not ready for payments"}, status=400)

    platform_fee = int(amount * 0.15)
    freelancer_amount = amount - platform_fee

    try:
        payment_intent = _stripe().PaymentIntent.create(
            amount=amount,
            currency="brl",
            automatic_payment_methods={"enabled": True},
            application_fee_amount=platform_fee,
            transfer_data={"destination": freelancer_account.stripe_account_id},
            metadata={
                "job_id": str(job_id or ""),
                "publisher_id": str(request.user.id),
                "freelancer_id": str(freelancer_uuid),
            },
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=400)

    Transaction.objects.create(
        stripe_payment_intent_id=payment_intent.id,
        publisher=request.user,
        freelancer_id=freelancer_uuid,
        job_id=normalized_job_id,
        amount=Decimal(amount) / Decimal("100"),
        platform_fee=Decimal(platform_fee) / Decimal("100"),
        freelancer_amount=Decimal(freelancer_amount) / Decimal("100"),
        type=Transaction.Type.PAYMENT,
        description=f"Pagamento Job {normalized_job_id or 'sem oportunidade'}",
        status=Transaction.Status.PENDING,
    )

    return Response(
        {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def list_transactions(request):
    role = request.query_params.get("role")
    user = request.user

    if role == "publisher":
        transactions = Transaction.objects.filter(publisher=user)
    elif role == "freelancer":
        transactions = Transaction.objects.filter(freelancer=user)
    else:
        transactions = Transaction.objects.filter(Q(publisher=user) | Q(freelancer=user))

    return Response(TransactionSerializer(transactions, many=True).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def list_dashboard_contracts(request):
    user = request.user
    contracts = (
        Contract.objects.select_related(
            "proposal__freelancer__user_id",
            "proposal__opportunity__publisher__user_id",
        )
        .filter(
            Q(proposal__freelancer__user_id=user)
            | Q(proposal__opportunity__publisher__user_id=user)
        )
        .order_by("-updated_at")
    )
    return Response(DashboardContractSerializer(contracts, many=True).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def approve_contract_completion(request, contract_id):
    try:
        contract = Contract.objects.select_related(
            "proposal__freelancer__user_id",
            "proposal__opportunity__publisher__user_id",
        ).get(pk=contract_id)
    except Contract.DoesNotExist:
        return Response({"error": "Contrato nao encontrado."}, status=404)

    user = request.user
    is_freelancer = contract.proposal.freelancer.user_id_id == user.id
    is_publisher = contract.proposal.opportunity.publisher.user_id_id == user.id

    if not (is_freelancer or is_publisher):
        return Response({"error": "Sem permissao para atualizar este contrato."}, status=403)

    if contract.status != Contract.Status.ACTIVE:
        return Response({"error": "Apenas contratos ativos podem ser finalizados."}, status=400)

    if is_freelancer:
        contract.freelancer_completion_approved = True
    if is_publisher:
        contract.publisher_completion_approved = True

    if contract.freelancer_completion_approved and contract.publisher_completion_approved:
        now = timezone.now()
        contract.status = Contract.Status.COMPLETED
        contract.end_date = now.date()
        contract.completed_at = now

    contract.save()
    return Response(DashboardContractSerializer(contract).data)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def stripe_webhook(request):
    if not settings.STRIPE_WEBHOOK_SECRET:
        return Response({"error": "STRIPE_WEBHOOK_SECRET is not configured"}, status=500)

    signature = request.META.get("HTTP_STRIPE_SIGNATURE")
    try:
        event = _stripe().Webhook.construct_event(
            request.body,
            signature,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError:
        return Response(status=400)
    except Exception:
        return Response(status=400)

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        Transaction.objects.filter(stripe_payment_intent_id=intent["id"]).update(
            status=Transaction.Status.COMPLETED
        )
    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        Transaction.objects.filter(stripe_payment_intent_id=intent["id"]).update(
            status=Transaction.Status.FAILED
        )

    return Response({"status": "processed"})
