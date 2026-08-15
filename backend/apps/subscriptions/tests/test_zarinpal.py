from datetime import date
from unittest.mock import patch

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.subscriptions.gateways.zarinpal import PaymentRequestResult, PaymentVerificationResult
from apps.subscriptions.models import SubscriptionOrder


pytestmark = pytest.mark.django_db


def listener(email="payer@example.com"):
    return User.objects.create_user(
        email=email,
        password="VeryStrongPass908!",
        display_name="Payer",
        birth_date=date(2000, 1, 1),
        role=User.Role.LISTENER,
    )


def authenticated_client(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def create_order(user):
    response = authenticated_client(user).post(
        "/api/v1/subscriptions/orders/",
        {"plan": "silver", "months": 1, "idempotency_key": "zarinpal-test"},
        format="json",
    )
    assert response.status_code == 201
    return SubscriptionOrder.objects.get(pk=response.data["order_id"])


@override_settings(
    ZARINPAL_CALLBACK_URL="http://127.0.0.1:9000/api/v1/subscriptions/zarinpal/callback/",
    ZARINPAL_START_PAY_BASE_URL="https://sandbox.zarinpal.com/pg/StartPay",
)
@patch("apps.subscriptions.services.request_payment")
def test_payment_start_uses_server_amount_and_returns_start_pay_url(mock_request):
    mock_request.return_value = PaymentRequestResult(100, "S000000000000000000000000000001", "Success")
    user = listener()
    order = create_order(user)

    response = authenticated_client(user).post(f"/api/v1/subscriptions/orders/{order.id}/pay/")

    assert response.status_code == 200
    assert response.data["payment_url"].endswith("/S000000000000000000000000000001")
    assert mock_request.call_args.kwargs["amount"] == order.total_amount
    assert f"order_id={order.id}" in mock_request.call_args.kwargs["callback_url"]


@override_settings(FRONTEND_ORIGIN="http://localhost:5173")
@patch("apps.subscriptions.services.verify_payment")
def test_successful_callback_verifies_and_activates_subscription(mock_verify):
    mock_verify.return_value = PaymentVerificationResult(100, "123456789", "Verified")
    user = listener()
    order = create_order(user)
    order.gateway_authority = "S000000000000000000000000000002"
    order.save(update_fields=("gateway_authority",))

    response = APIClient().get(
        "/api/v1/subscriptions/zarinpal/callback/",
        {"order_id": str(order.id), "Authority": order.gateway_authority, "Status": "OK"},
    )

    assert response.status_code == 302
    assert "payment=success" in response.url
    assert "ref_id=123456789" in response.url
    order.refresh_from_db()
    user.subscription.refresh_from_db()
    assert order.status == SubscriptionOrder.Status.PAID
    assert user.subscription.plan.code == "silver"
    mock_verify.assert_called_once_with(amount=order.total_amount, authority=order.gateway_authority)


@override_settings(FRONTEND_ORIGIN="http://localhost:5173")
@patch("apps.subscriptions.services.verify_payment")
def test_cancelled_callback_never_verifies_or_activates(mock_verify):
    user = listener()
    order = create_order(user)
    order.gateway_authority = "S000000000000000000000000000003"
    order.save(update_fields=("gateway_authority",))

    response = APIClient().get(
        "/api/v1/subscriptions/zarinpal/callback/",
        {"order_id": str(order.id), "Authority": order.gateway_authority, "Status": "NOK"},
    )

    assert response.status_code == 302
    assert "payment=cancelled" in response.url
    mock_verify.assert_not_called()
    order.refresh_from_db()
    user.subscription.refresh_from_db()
    assert order.status == SubscriptionOrder.Status.CANCELLED
    assert user.subscription.plan.code == "free"


def test_only_order_owner_can_start_payment():
    owner = listener("owner-payment@example.com")
    stranger = listener("stranger-payment@example.com")
    order = create_order(owner)

    response = authenticated_client(stranger).post(f"/api/v1/subscriptions/orders/{order.id}/pay/")

    assert response.status_code == 404
