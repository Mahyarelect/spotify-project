from django.urls import path

from .views import (
    AdminPlanPriceUpdateView,
    CurrentSubscriptionView,
    MockSubscriptionConfirmationView,
    PlanListView,
    SubscriptionOrderCreateView,
    SubscriptionOrderDetailView,
)


urlpatterns = [
    path("subscriptions/plans/", PlanListView.as_view(), name="subscription-plans"),
    path("subscriptions/me/", CurrentSubscriptionView.as_view(), name="current-subscription"),
    path("subscriptions/orders/", SubscriptionOrderCreateView.as_view(), name="subscription-order-create"),
    path(
        "subscriptions/orders/<uuid:order_id>/",
        SubscriptionOrderDetailView.as_view(),
        name="subscription-order-detail",
    ),
    path(
        "subscriptions/orders/<uuid:order_id>/confirm/",
        MockSubscriptionConfirmationView.as_view(),
        name="subscription-order-confirm",
    ),
    path(
        "admin/subscription-plans/<str:code>/",
        AdminPlanPriceUpdateView.as_view(),
        name="admin-plan-price-update",
    ),
]
