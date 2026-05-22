from django.urls import path

from . import views


urlpatterns = [
    path("account/create/", views.create_connect_account, name="create-account"),
    path("account/", views.get_account, name="get-account"),
    path("payment-intent/", views.create_payment_intent, name="payment-intent"),
    path("transactions/", views.list_transactions, name="transactions"),
    path("contracts/", views.list_dashboard_contracts, name="dashboard-contracts"),
    path(
        "contracts/<uuid:contract_id>/complete/",
        views.approve_contract_completion,
        name="contract-complete",
    ),
    path("webhook/", views.stripe_webhook, name="stripe-webhook"),
    path("reviews/summary/", views.reviews_summary, name="reviews-summary"),
]
