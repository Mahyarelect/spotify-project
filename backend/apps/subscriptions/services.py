from django.db import transaction
from rest_framework.exceptions import PermissionDenied

from .models import SubscriptionPlan, UserSubscription
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
