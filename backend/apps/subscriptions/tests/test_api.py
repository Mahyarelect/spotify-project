from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.db import connection
from django.test import override_settings
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from freezegun import freeze_time
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.common.domain import DomainError
from apps.subscriptions.models import SubscriptionOrder, SubscriptionPlan, UserSubscription
from apps.subscriptions.services import activate_paid_order, mark_order_failed


pytestmark = pytest.mark.django_db
PASSWORD = "VeryStrongPass908!"


def create_user(email="listener@example.com", role=User.Role.LISTENER):
    return User.objects.create_user(
        email=email,
        password=PASSWORD,
        display_name=role.title(),
        birth_date=date(2000, 1, 1),
        role=role,
        is_staff=role in {User.Role.SUPPORT, User.Role.ADMIN},
        is_superuser=role == User.Role.ADMIN,
    )


def client_for(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def order_payload(**overrides):
    payload = {"plan": "silver", "months": 3, "idempotency_key": "checkout-123"}
    payload.update(overrides)
    return payload


def create_order(user, **overrides):
    response = client_for(user).post("/api/v1/subscriptions/orders/", order_payload(**overrides), format="json")
    assert response.status_code == 201
    return SubscriptionOrder.objects.get(pk=response.data["order_id"])


def test_plan_list_returns_database_prices_limits_and_billing_months():
    response = APIClient().get("/api/v1/subscriptions/plans/")

    assert response.status_code == 200
    assert [plan["code"] for plan in response.data] == ["free", "silver", "gold"]
    assert response.data[1]["monthly_price"] == "9.99"
    assert response.data[1]["allowed_billing_months"] == [1, 3, 6, 12]
    assert response.data[2]["limits"]["max_playlists"] is None


def test_plan_list_has_no_per_plan_queries():
    with CaptureQueriesContext(connection) as queries:
        response = APIClient().get("/api/v1/subscriptions/plans/")

    assert response.status_code == 200
    assert len(queries) == 1


def test_current_subscription_uses_effective_expiry_fallback():
    user = create_user()
    user.subscription.plan = SubscriptionPlan.objects.get(code="gold")
    user.subscription.expires_at = timezone.now() - timedelta(seconds=1)
    user.subscription.save()

    response = client_for(user).get("/api/v1/subscriptions/me/")

    assert response.status_code == 200
    assert response.data["plan"] == "free"
    assert response.data["limits"]["daily_stream_limit"] == 60


@pytest.mark.parametrize("patch", [{"plan": "free"}, {"months": 2}])
def test_order_rejects_free_plan_and_invalid_months(patch):
    response = client_for(create_user()).post(
        "/api/v1/subscriptions/orders/", order_payload(**patch), format="json"
    )

    assert response.status_code == 400
    assert SubscriptionOrder.objects.count() == 0


def test_order_total_is_calculated_from_server_snapshot():
    user = create_user()
    response = client_for(user).post(
        "/api/v1/subscriptions/orders/",
        order_payload(months=6, total_amount="0.01"),
        format="json",
    )

    assert response.status_code == 400
    clean = client_for(user).post(
        "/api/v1/subscriptions/orders/",
        order_payload(months=6, idempotency_key="clean-key"),
        format="json",
    )
    assert clean.data["unit_price"] == "9.99"
    assert clean.data["total_amount"] == "59.94"


def test_idempotency_key_returns_same_order_and_rejects_different_quote():
    user = create_user()
    client = client_for(user)
    first = client.post("/api/v1/subscriptions/orders/", order_payload(), format="json")
    repeat = client.post("/api/v1/subscriptions/orders/", order_payload(), format="json")
    conflict = client.post(
        "/api/v1/subscriptions/orders/",
        order_payload(plan="gold"),
        format="json",
    )

    assert first.status_code == 201
    assert repeat.status_code == 200
    assert repeat.data["order_id"] == first.data["order_id"]
    assert conflict.status_code == 409
    assert SubscriptionOrder.objects.count() == 1


@pytest.mark.parametrize("role", [User.Role.ARTIST, User.Role.SUPPORT, User.Role.ADMIN])
def test_non_listener_cannot_self_purchase(role):
    response = client_for(create_user(f"{role}@example.com", role)).post(
        "/api/v1/subscriptions/orders/", order_payload(), format="json"
    )

    assert response.status_code == 403


@freeze_time("2026-01-31 12:00:00", tz_offset=0)
def test_activation_updates_entitlement_with_clamped_month_end():
    user = create_user()
    order = create_order(user, months=1)

    activate_paid_order(order.id, "provider-1")

    user.subscription.refresh_from_db()
    assert user.subscription.plan.code == "silver"
    assert user.subscription.expires_at.isoformat().startswith("2026-02-28T12:00:00")


@freeze_time("2026-01-01 00:00:00", tz_offset=0)
def test_same_plan_renewal_extends_from_future_expiry():
    user = create_user()
    user.subscription.plan = SubscriptionPlan.objects.get(code="silver")
    user.subscription.expires_at = timezone.now() + timedelta(days=15)
    user.subscription.save()
    previous_expiry = user.subscription.expires_at
    order = create_order(user, months=1)

    activate_paid_order(order.id, "provider-renewal")

    user.subscription.refresh_from_db()
    assert user.subscription.expires_at > previous_expiry + timedelta(days=27)


def test_different_plan_upgrade_starts_immediately():
    user = create_user()
    user.subscription.plan = SubscriptionPlan.objects.get(code="silver")
    user.subscription.expires_at = timezone.now() + timedelta(days=90)
    user.subscription.save()
    order = create_order(user, plan="gold", months=1)
    before = timezone.now()

    activate_paid_order(order.id, "provider-upgrade")

    user.subscription.refresh_from_db()
    assert user.subscription.plan.code == "gold"
    assert before <= user.subscription.starts_at <= timezone.now()
    assert user.subscription.expires_at < before + timedelta(days=40)


def test_repeated_callback_does_not_extend_twice():
    user = create_user()
    order = create_order(user, months=3)
    activate_paid_order(order.id, "provider-repeat")
    user.subscription.refresh_from_db()
    first_expiry = user.subscription.expires_at

    activate_paid_order(order.id, "provider-repeat")

    user.subscription.refresh_from_db()
    assert user.subscription.expires_at == first_expiry


def test_failed_order_does_not_change_entitlement():
    user = create_user()
    order = create_order(user)

    mark_order_failed(order.id)

    user.subscription.refresh_from_db()
    assert user.subscription.plan.code == "free"
    with pytest.raises(DomainError, match="Only pending orders can be activated"):
        activate_paid_order(order.id, "failed-order")


def test_only_order_owner_can_read_status():
    owner = create_user("owner@example.com")
    stranger = create_user("stranger@example.com")
    order = create_order(owner)

    assert client_for(owner).get(f"/api/v1/subscriptions/orders/{order.id}/").status_code == 200
    assert client_for(stranger).get(f"/api/v1/subscriptions/orders/{order.id}/").status_code == 404


@override_settings(DEBUG=True)
def test_development_mock_confirmation_is_owner_only_and_idempotent():
    owner = create_user("owner@example.com")
    stranger = create_user("stranger@example.com")
    order = create_order(owner)
    url = f"/api/v1/subscriptions/orders/{order.id}/confirm/"

    assert client_for(stranger).post(url).status_code == 404
    first = client_for(owner).post(url)
    second = client_for(owner).post(url)

    assert first.status_code == second.status_code == 200
    assert first.data["status"] == "paid"


@override_settings(DEBUG=False)
def test_mock_confirmation_is_hidden_outside_debug():
    user = create_user()
    order = create_order(user)

    assert client_for(user).post(f"/api/v1/subscriptions/orders/{order.id}/confirm/").status_code == 404


def test_admin_can_update_paid_price_and_other_roles_cannot():
    admin = create_user("admin@example.com", User.Role.ADMIN)
    listener = create_user()
    url = "/api/v1/admin/subscription-plans/silver/"

    denied = client_for(listener).patch(url, {"monthly_price": "12.50"}, format="json")
    updated = client_for(admin).patch(url, {"monthly_price": "12.50"}, format="json")

    assert denied.status_code == 403
    assert updated.status_code == 200
    assert SubscriptionPlan.objects.get(code="silver").monthly_price == Decimal("12.50")
    assert APIClient().get("/api/v1/subscriptions/plans/").data[1]["monthly_price"] == "12.50"


def test_free_price_cannot_be_changed():
    admin = create_user("admin@example.com", User.Role.ADMIN)
    response = client_for(admin).patch(
        "/api/v1/admin/subscription-plans/free/",
        {"monthly_price": "1.00"},
        format="json",
    )

    assert response.status_code == 400
    assert SubscriptionPlan.objects.get(code="free").monthly_price == Decimal("0.00")
