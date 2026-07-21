from datetime import date, timedelta

import pytest
from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from apps.subscriptions.selectors import get_effective_entitlements
from apps.subscriptions.services import get_daily_stream_limit, get_playlist_limit, require_feature


pytestmark = pytest.mark.django_db


def create_user(email="listener@example.com"):
    return User.objects.create_user(
        email=email,
        password="Password123!",
        display_name="Listener",
        birth_date=date(2000, 1, 1),
    )


def test_data_migration_creates_exactly_required_plans():
    assert list(SubscriptionPlan.objects.values_list("code", flat=True)) == ["free", "silver", "gold"]


def test_seeded_plan_entitlements_match_specification():
    free = SubscriptionPlan.objects.get(code="free")
    silver = SubscriptionPlan.objects.get(code="silver")
    gold = SubscriptionPlan.objects.get(code="gold")

    assert (free.daily_stream_limit, free.max_playlists, free.profile_image_allowed) == (60, 6, False)
    assert (silver.daily_stream_limit, silver.max_playlists, silver.download_allowed) == (None, 100, True)
    assert (gold.max_playlists, gold.early_access_allowed, gold.statistics_allowed) == (None, True, True)


def test_new_user_receives_preferences_and_free_entitlement():
    user = create_user()

    assert user.preferences.language == "en"
    assert user.subscription.plan.code == "free"
    assert user.subscription.expires_at is None


def test_active_paid_subscription_is_effective():
    user = create_user()
    user.subscription.plan = SubscriptionPlan.objects.get(code="silver")
    user.subscription.expires_at = timezone.now() + timedelta(days=30)
    user.subscription.save()

    entitlement = get_effective_entitlements(user)

    assert entitlement.plan_code == "silver"
    assert entitlement.profile_image_allowed is True
    assert entitlement.max_playlists == 100


@pytest.mark.parametrize("status", [UserSubscription.Status.EXPIRED, UserSubscription.Status.CANCELLED])
def test_inactive_paid_subscription_resolves_to_free(status):
    user = create_user()
    user.subscription.plan = SubscriptionPlan.objects.get(code="gold")
    user.subscription.status = status
    user.subscription.expires_at = timezone.now() + timedelta(days=30)
    user.subscription.save()

    assert get_effective_entitlements(user).plan_code == "free"


def test_expired_paid_subscription_resolves_to_free_immediately():
    user = create_user()
    user.subscription.plan = SubscriptionPlan.objects.get(code="gold")
    user.subscription.expires_at = timezone.now() - timedelta(seconds=1)
    user.subscription.save()

    entitlement = get_effective_entitlements(user)

    assert entitlement.plan_code == "free"
    assert entitlement.daily_stream_limit == 60


def test_limit_and_feature_helpers_use_effective_plan():
    user = create_user()

    assert get_daily_stream_limit(user) == 60
    assert get_playlist_limit(user) == 6
    with pytest.raises(PermissionDenied):
        require_feature(user, "download_allowed")


@override_settings(DEBUG=True)
def test_demo_seed_is_idempotent():
    call_command("seed_demo_data")
    call_command("seed_demo_data")

    assert User.objects.filter(email__in={
        "mahyar@example.com",
        "ali@example.com",
        "hasan@example.com",
        "parsa@example.com",
    }).count() == 4
    assert UserSubscription.objects.filter(user__email="ali@example.com", plan__code="silver").count() == 1
