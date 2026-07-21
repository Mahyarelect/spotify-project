import calendar
from datetime import datetime
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User
from apps.common.domain import DomainError
from apps.common.events import subscription_activated

from .models import SubscriptionOrder, SubscriptionPlan, UserSubscription
from .selectors import get_effective_entitlements


@transaction.atomic
def ensure_free_subscription(user) -> UserSubscription:
    free_plan = SubscriptionPlan.objects.get(code=SubscriptionPlan.Code.FREE)
    subscription, _ = UserSubscription.objects.get_or_create(
        user=user,
        defaults={
            "plan": free_plan,
            "status": UserSubscription.Status.ACTIVE,
            "expires_at": None,
        },
    )
    return subscription


def require_feature(user, feature: str) -> None:
    allowed_features = {
        "profile_image_allowed",
        "download_allowed",
        "early_access_allowed",
        "statistics_allowed",
    }
    if feature not in allowed_features:
        raise ValueError(f"Unknown plan feature: {feature}")
    if not getattr(get_effective_entitlements(user), feature):
        raise PermissionDenied(
            detail=f"Your current subscription does not include {feature.replace('_', ' ')}.",
            code=f"{feature}_required",
        )


def get_daily_stream_limit(user) -> int | None:
    return get_effective_entitlements(user).daily_stream_limit


def get_playlist_limit(user) -> int | None:
    return get_effective_entitlements(user).max_playlists


def add_months_clamped(value: datetime, months: int) -> datetime:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def create_subscription_order(*, user, plan_code: str, months: int, idempotency_key: str):
    if user.role != User.Role.LISTENER:
        raise DomainError("subscription_purchase_forbidden", "Only listener accounts can buy subscriptions.", status_code=403)
    if months not in SubscriptionOrder.Months.values:
        raise DomainError(
            "invalid_billing_months",
            "Billing duration must be 1, 3, 6, or 12 months.",
            fields={"months": ["Choose 1, 3, 6, or 12 months."]},
        )
    try:
        plan = SubscriptionPlan.objects.get(code=plan_code, is_active=True)
    except SubscriptionPlan.DoesNotExist as error:
        raise DomainError("plan_not_found", "The selected subscription plan is unavailable.", status_code=404) from error
    if plan.code == SubscriptionPlan.Code.FREE:
        raise DomainError("free_plan_order_not_allowed", "The Free plan does not require an order.")

    key = idempotency_key.strip()
    if not key:
        raise DomainError(
            "idempotency_key_required",
            "An idempotency key is required.",
            fields={"idempotency_key": ["This field is required."]},
        )
    existing = SubscriptionOrder.objects.filter(user=user, idempotency_key=key).first()
    if existing is not None:
        if existing.plan_id != plan.id or existing.months != months:
            raise DomainError(
                "idempotency_key_conflict",
                "This idempotency key was already used for a different order.",
                status_code=409,
            )
        return existing, False

    unit_price = Decimal(plan.monthly_price)
    try:
        with transaction.atomic():
            order = SubscriptionOrder.objects.create(
                user=user,
                plan=plan,
                months=months,
                unit_price_snapshot=unit_price,
                total_amount=unit_price * months,
                currency=plan.currency,
                idempotency_key=key,
            )
    except IntegrityError:
        existing = SubscriptionOrder.objects.get(user=user, idempotency_key=key)
        if existing.plan_id != plan.id or existing.months != months:
            raise DomainError(
                "idempotency_key_conflict",
                "This idempotency key was already used for a different order.",
                status_code=409,
            )
        return existing, False
    return order, True


@transaction.atomic
def activate_paid_order(order_id, provider_reference: str) -> SubscriptionOrder:
    order = (
        SubscriptionOrder.objects.select_for_update()
        .select_related("plan", "user")
        .get(pk=order_id)
    )
    if order.status == SubscriptionOrder.Status.PAID:
        return order
    if order.status != SubscriptionOrder.Status.PENDING:
        raise DomainError("order_not_pending", "Only pending orders can be activated.", status_code=409)

    now = timezone.now()
    subscription = UserSubscription.objects.select_for_update().select_related("plan").get(user=order.user)
    renews_same_plan = (
        subscription.plan_id == order.plan_id
        and subscription.status == UserSubscription.Status.ACTIVE
        and subscription.expires_at is not None
        and subscription.expires_at > now
    )
    expiry_base = subscription.expires_at if renews_same_plan else now
    new_expiry = add_months_clamped(expiry_base, order.months)

    order.status = SubscriptionOrder.Status.PAID
    order.provider_reference = provider_reference
    order.paid_at = now
    try:
        order.save(update_fields=("status", "provider_reference", "paid_at"))
    except IntegrityError as error:
        raise DomainError(
            "provider_reference_conflict",
            "This payment reference was already processed.",
            status_code=409,
        ) from error

    subscription.plan = order.plan
    subscription.status = UserSubscription.Status.ACTIVE
    subscription.starts_at = subscription.starts_at if renews_same_plan else now
    subscription.expires_at = new_expiry
    subscription.source_order = order
    subscription.save()
    transaction.on_commit(
        lambda: subscription_activated.send_robust(
            sender=SubscriptionOrder,
            order_id=order.id,
            user_id=order.user_id,
        )
    )
    return order


@transaction.atomic
def mark_order_failed(order_id) -> SubscriptionOrder:
    order = SubscriptionOrder.objects.select_for_update().get(pk=order_id)
    if order.status == SubscriptionOrder.Status.PENDING:
        order.status = SubscriptionOrder.Status.FAILED
        order.save(update_fields=("status",))
    return order


@transaction.atomic
def update_plan_price(*, actor, code: str, monthly_price: Decimal) -> SubscriptionPlan:
    if not (actor.is_staff and actor.role == User.Role.ADMIN):
        raise DomainError("plan_price_update_forbidden", "Only administrators can update plan prices.", status_code=403)
    if code not in {SubscriptionPlan.Code.SILVER, SubscriptionPlan.Code.GOLD}:
        raise DomainError("plan_not_editable", "Only Silver and Gold prices can be updated.")
    plan = SubscriptionPlan.objects.select_for_update().get(code=code)
    plan.monthly_price = monthly_price
    plan.full_clean()
    plan.save(update_fields=("monthly_price", "updated_at"))
    return plan


def expire_due_subscriptions(at=None) -> int:
    at = at or timezone.now()
    return UserSubscription.objects.filter(
        status=UserSubscription.Status.ACTIVE,
        expires_at__isnull=False,
        expires_at__lte=at,
    ).exclude(plan__code=SubscriptionPlan.Code.FREE).update(status=UserSubscription.Status.EXPIRED)
