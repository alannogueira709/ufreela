from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import transaction as db_transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from jobs.models import Opportunity, Proposal

from .models import Contract, StripeAccount, Transaction, Review
from .serializers import DashboardContractSerializer, StripeAccountSerializer, TransactionSerializer
from django.db.models import Avg, Count

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


PLATFORM_FEE_RATE = Decimal("0.15")


def _money_to_cents(value: Decimal) -> int:
    return int((Decimal(value) * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _create_account_link(stripe_client, account_id: str):
    return stripe_client.AccountLink.create(
        account=account_id,
        refresh_url=f"{settings.FRONTEND_URL}/settings?tab=billing&error=true",
        return_url=f"{settings.FRONTEND_URL}/settings?tab=billing&success=true",
        type="account_onboarding",
    )


def _sync_stripe_account_status(account: StripeAccount) -> StripeAccount:
    stripe_acc = _stripe().Account.retrieve(account.stripe_account_id)
    requirements = getattr(stripe_acc, "requirements", None)
    currently_due = getattr(requirements, "currently_due", []) if requirements else []
    account.charges_enabled = bool(stripe_acc.charges_enabled)
    account.payouts_enabled = bool(stripe_acc.payouts_enabled)
    account.requirements_due = list(currently_due)
    account.status = (
        StripeAccount.Status.ACTIVE
        if account.payouts_enabled
        else StripeAccount.Status.PENDING
    )
    account.save()
    return account


def _get_proposal_for_checkout(proposal_id):
    try:
        normalized_id = int(proposal_id)
    except (TypeError, ValueError):
        return None

    try:
        return (
            Proposal.objects.select_related(
                "freelancer__user_id",
                "opportunity__publisher__user_id",
                "opportunity",
            )
            .get(pk=normalized_id)
        )
    except Proposal.DoesNotExist:
        return None


def _create_contract_from_paid_proposal(proposal: Proposal) -> Contract:
    proposal.status = Proposal.Status.ACCEPTED
    proposal.save(update_fields=["status", "updated_at"])

    Opportunity.objects.filter(pk=proposal.opportunity_id).update(
        status=Opportunity.Status.CLOSED,
    )
    Proposal.objects.filter(
        opportunity=proposal.opportunity,
        status=Proposal.Status.PENDING,
    ).exclude(pk=proposal.pk).update(status=Proposal.Status.REJECTED)

    contract, _ = Contract.objects.get_or_create(
        proposal=proposal,
        defaults={
            "start_date": timezone.localdate(),
            "end_date": proposal.opportunity.deadline,
            "total_value": proposal.proposed_value,
            "status": Contract.Status.ACTIVE,
        },
    )
    return contract


def _release_escrow(contract: Contract):
    if contract.escrow_released_at:
        return None

    proposal = contract.proposal
    freelancer_user = proposal.freelancer.user_id

    try:
        freelancer_account = StripeAccount.objects.get(
            user=freelancer_user,
            payouts_enabled=True,
        )
    except StripeAccount.DoesNotExist as exc:
        raise ValueError("Freelancer sem conta Stripe habilitada para receber fundos.") from exc

    payment = (
        Transaction.objects.filter(
            freelancer=freelancer_user,
            job_id=str(proposal.opportunity_id),
            status=Transaction.Status.COMPLETED,
            type=Transaction.Type.PAYMENT,
            metadata__proposal_id=str(proposal.proposal_id),
        )
        .order_by("-created_at")
        .first()
    )
    if payment is None:
        raise ValueError("Pagamento em escrow nao encontrado para este contrato.")

    if payment.stripe_transfer_id:
        return payment.stripe_transfer_id

    transfer = _stripe().Transfer.create(
        amount=_money_to_cents(payment.freelancer_amount),
        currency="brl",
        destination=freelancer_account.stripe_account_id,
        metadata={
            "contract_id": str(contract.contract_id),
            "proposal_id": str(proposal.proposal_id),
            "transaction_id": str(payment.id),
        },
        idempotency_key=f"contract-{contract.contract_id}-escrow-release",
    )

    payment.stripe_transfer_id = transfer.id
    payment.save(update_fields=["stripe_transfer_id", "updated_at"])
    return transfer.id


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_connect_account(request):
    user = request.user
    if not getattr(user, "role", None) or user.role.role_name != "freelancer":
        return Response({"error": "Apenas freelancers podem configurar recebimentos."}, status=403)

    try:
        stripe_client = _stripe()
        existing_account = getattr(user, "stripe_account", None)
        if existing_account:
            account_link = _create_account_link(
                stripe_client,
                existing_account.stripe_account_id,
            )
            return Response(
                {
                    "account": StripeAccountSerializer(existing_account).data,
                    "onboarding_url": account_link.url,
                }
            )

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

        account_link = _create_account_link(stripe_client, account.id)

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
        account = _sync_stripe_account_status(account)
    except Exception:
        pass

    return Response(StripeAccountSerializer(account).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    proposal = _get_proposal_for_checkout(request.data.get("proposal_id"))
    if proposal is None:
        return Response({"error": "proposal_id invalido."}, status=400)

    if proposal.opportunity.publisher.user_id_id != request.user.id:
        return Response({"error": "Sem permissao para pagar esta proposta."}, status=403)

    if proposal.status != Proposal.Status.PENDING:
        return Response({"error": "Apenas propostas pendentes podem iniciar pagamento."}, status=400)

    if proposal.opportunity.deadline is None:
        return Response({"error": "Defina uma data final para o contrato antes do pagamento."}, status=400)

    if proposal.opportunity.deadline < timezone.localdate():
        return Response({"error": "A data final do contrato nao pode estar no passado."}, status=400)

    try:
        freelancer_account = StripeAccount.objects.get(
            user=proposal.freelancer.user_id,
        )
    except StripeAccount.DoesNotExist:
        return Response({"error": "Freelancer not ready for payouts"}, status=400)

    try:
        freelancer_account = _sync_stripe_account_status(freelancer_account)
    except Exception:
        pass

    if not freelancer_account.payouts_enabled:
        return Response({"error": "Freelancer not ready for payouts"}, status=400)

    amount = _money_to_cents(proposal.proposed_value)
    platform_fee = int((Decimal(amount) * PLATFORM_FEE_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    freelancer_amount = amount - platform_fee

    try:
        payment_intent = _stripe().PaymentIntent.create(
            amount=amount,
            currency="brl",
            automatic_payment_methods={"enabled": True},
            metadata={
                "proposal_id": str(proposal.proposal_id),
                "job_id": str(proposal.opportunity_id),
                "publisher_id": str(request.user.id),
                "freelancer_id": str(proposal.freelancer.user_id_id),
                "escrow": "true",
            },
            idempotency_key=f"proposal-{proposal.proposal_id}-escrow-payment",
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=400)

    Transaction.objects.update_or_create(
        stripe_payment_intent_id=payment_intent.id,
        defaults={
            "publisher": request.user,
            "freelancer": proposal.freelancer.user_id,
            "job_id": str(proposal.opportunity_id),
            "opportunity": proposal.opportunity,
            "amount": Decimal(amount) / Decimal("100"),
            "platform_fee": Decimal(platform_fee) / Decimal("100"),
            "freelancer_amount": Decimal(freelancer_amount) / Decimal("100"),
            "type": Transaction.Type.PAYMENT,
            "description": f"Escrow da proposta #{proposal.proposal_id}",
            "status": Transaction.Status.PENDING,
            "metadata": {
                "proposal_id": str(proposal.proposal_id),
                "opportunity_id": str(proposal.opportunity_id),
                "escrow": True,
            },
        },
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

    with db_transaction.atomic():
        if is_freelancer:
            contract.freelancer_completion_approved = True
        if is_publisher:
            contract.publisher_completion_approved = True

        should_release = (
            contract.freelancer_completion_approved
            and contract.publisher_completion_approved
            and not contract.escrow_released_at
        )

        if should_release:
            try:
                _release_escrow(contract)
            except ValueError as exc:
                contract.save(
                    update_fields=[
                        "freelancer_completion_approved",
                        "publisher_completion_approved",
                        "updated_at",
                    ]
                )
                return Response({"error": str(exc)}, status=400)

            now = timezone.now()
            contract.status = Contract.Status.COMPLETED
            contract.completed_at = now
            contract.escrow_released_at = now
            if contract.end_date is None:
                contract.end_date = now.date()

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
        with db_transaction.atomic():
            payment = (
                Transaction.objects.select_for_update()
                .filter(stripe_payment_intent_id=intent["id"])
                .first()
            )
            if payment:
                payment.status = Transaction.Status.COMPLETED
                payment.save(update_fields=["status", "updated_at"])

                proposal_id = (
                    str(intent.get("metadata", {}).get("proposal_id") or "")
                    or payment.metadata.get("proposal_id")
                )
                proposal = _get_proposal_for_checkout(proposal_id)
                if proposal and proposal.status == Proposal.Status.PENDING:
                    _create_contract_from_paid_proposal(proposal)
    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        Transaction.objects.filter(stripe_payment_intent_id=intent["id"]).update(
            status=Transaction.Status.FAILED
        )

    return Response({"status": "processed"})


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def reviews_summary(request):
    """Retorna média e quantidade de avaliações para um usuário (reviewee).

    Query param: reviewee=<user_id>
    Response: {"avg": "4.5", "count": 12}
    """
    reviewee = request.query_params.get("reviewee")
    if not reviewee:
        return Response({"error": "reviewee param is required"}, status=400)

    qs = Review.objects.filter(reviewee__id=reviewee)
    agg = qs.aggregate(avg=Avg("rating"), count=Count("pk"))
    avg = agg.get("avg") or 0
    count = agg.get("count") or 0

    # normaliza para string com 1 casa decimal compatível com frontend
    return Response({"avg": str(round(float(avg or 0), 1)), "count": int(count)})
