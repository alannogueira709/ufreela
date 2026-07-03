from django.contrib import admin
from .models import Contract, Payment, PaymentMethod, Review, StripeAccount, Transaction

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("contract_id", "proposal", "status", "total_value")
    list_filter = ("status",)
    search_fields = ("contract_id", "proposal__opportunity__title")

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("payment_id", "contract", "amount", "status")
    list_filter = ("status", "payment_method")
    search_fields = ("payment_id", "contract__contract_id")

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("review_id", "contract", "reviewer", "reviewee", "rating")
    list_filter = ("rating",)
    search_fields = ("reviewer__email", "reviewee__email")


@admin.register(StripeAccount)
class StripeAccountAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "charges_enabled", "payouts_enabled")
    list_filter = ("status", "charges_enabled", "payouts_enabled")
    search_fields = ("user__email", "stripe_account_id")


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "type", "brand", "last4", "is_default", "is_active")
    list_filter = ("type", "is_default", "is_active")
    search_fields = ("user__email", "stripe_payment_method_id")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "publisher", "freelancer", "amount", "type", "status")
    list_filter = ("type", "status")
    search_fields = ("publisher__email", "freelancer__email", "stripe_payment_intent_id")
