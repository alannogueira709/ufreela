from django.contrib import admin
from .models import Contract, Payment, Review

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
