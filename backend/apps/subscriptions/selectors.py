from dataclasses import dataclass
from datetime import datetime

from django.utils import timezone

from .models import SubscriptionPlan, UserSubscription


@dataclass(frozen=True)
class Entitlement:
    plan_code: str
    status: str
    starts_at: datetime
    expires_at: datetime | None
    daily_stream_limit: int | None
    max_playlists: int | None
    profile_image_allowed: bool
    download_allowed: bool
    early_access_allowed: bool
    statistics_allowed: bool


def _as_entitlement(subscription: UserSubscription, plan: SubscriptionPlan) -> Entitlement:
    return Entitlement(
        plan_code=plan.code,
        status=UserSubscription.Status.ACTIVE,
        starts_at=subscription.starts_at,
        expires_at=subscription.expires_at if plan.code != SubscriptionPlan.Code.FREE else None,
        daily_stream_limit=plan.daily_stream_limit,
        max_playlists=plan.max_playlists,
        profile_image_allowed=plan.profile_image_allowed,
        download_allowed=plan.download_allowed,
        early_access_allowed=plan.early_access_allowed,
        statistics_allowed=plan.statistics_allowed,
    )


def get_effective_entitlements(user, at: datetime | None = None) -> Entitlement:
    at = at or timezone.now()
    subscription = (
        UserSubscription.objects.select_related("plan")
        .filter(user=user)
        .first()
    )
    if subscription is None:
        from .services import ensure_free_subscription

        subscription = ensure_free_subscription(user)

    paid_is_effective = (
        subscription.plan.code != SubscriptionPlan.Code.FREE
        and subscription.status == UserSubscription.Status.ACTIVE
        and subscription.expires_at is not None
        and subscription.expires_at > at
    )
    if subscription.plan.code == SubscriptionPlan.Code.FREE or paid_is_effective:
        return _as_entitlement(subscription, subscription.plan)

    free_plan = SubscriptionPlan.objects.get(code=SubscriptionPlan.Code.FREE, is_active=True)
    return _as_entitlement(subscription, free_plan)
