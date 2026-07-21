from django.contrib import admin

from .models import SubscriptionOrder, SubscriptionPlan, UserSubscription


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("code", "display_name", "monthly_price", "currency", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("code", "display_name")


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "status", "starts_at", "expires_at")
    list_filter = ("status", "plan")
    search_fields = ("user__email", "user__username")


@admin.register(SubscriptionOrder)
class SubscriptionOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "plan", "months", "total_amount", "currency", "status", "created_at")
    list_filter = ("status", "plan")
    search_fields = ("user__email", "idempotency_key", "provider_reference")
    readonly_fields = (
        "unit_price_snapshot",
        "total_amount",
        "currency",
        "idempotency_key",
        "provider_reference",
        "created_at",
        "paid_at",
    )
