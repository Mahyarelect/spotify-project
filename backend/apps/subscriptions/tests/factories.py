from decimal import Decimal

import factory
from factory.django import DjangoModelFactory

from apps.accounts.tests.factories import UserFactory
from apps.subscriptions.models import SubscriptionOrder, SubscriptionPlan, UserSubscription


class SubscriptionPlanFactory(DjangoModelFactory):
    class Meta:
        model = SubscriptionPlan
        django_get_or_create = ("code",)

    code = SubscriptionPlan.Code.SILVER
    display_name = "Silver"
    monthly_price = Decimal("9.99")
    currency = "USD"
    daily_stream_limit = None
    max_playlists = 100
    profile_image_allowed = True
    download_allowed = True


class UserSubscriptionFactory(DjangoModelFactory):
    class Meta:
        model = UserSubscription
        django_get_or_create = ("user",)

    user = factory.SubFactory(UserFactory)
    plan = factory.SubFactory(SubscriptionPlanFactory)


class SubscriptionOrderFactory(DjangoModelFactory):
    class Meta:
        model = SubscriptionOrder

    user = factory.SubFactory(UserFactory)
    plan = factory.SubFactory(SubscriptionPlanFactory)
    months = 1
    unit_price_snapshot = Decimal("9.99")
    total_amount = Decimal("9.99")
    currency = "USD"
    idempotency_key = factory.Sequence(lambda number: f"order-key-{number}")
