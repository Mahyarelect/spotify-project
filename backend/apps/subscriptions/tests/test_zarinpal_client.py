import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from apps.subscriptions.gateways.zarinpal import request_payment, verify_payment


@override_settings(
    ZARINPAL_MERCHANT_ID="c8d2f8b6-07c1-496c-9f4c-f8e8afae1955",
    ZARINPAL_API_BASE_URL="https://sandbox.zarinpal.com/pg/v4/payment",
    ZARINPAL_TIMEOUT_SECONDS=10,
)
class ZarinpalClientTests(SimpleTestCase):
    @patch("apps.subscriptions.gateways.zarinpal.urlopen")
    def test_request_payload_matches_sandbox_contract(self, mock_urlopen):
        response = MagicMock()
        response.read.return_value = json.dumps(
            {"data": {"code": 100, "authority": "S-authority", "message": "Success"}, "errors": []}
        ).encode()
        mock_urlopen.return_value.__enter__.return_value = response

        result = request_payment(
            amount=Decimal("150000"),
            description="test",
            callback_url="http://localhost/callback",
        )

        request = mock_urlopen.call_args.args[0]
        assert request.full_url == "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
        assert json.loads(request.data) == {
            "merchant_id": "c8d2f8b6-07c1-496c-9f4c-f8e8afae1955",
            "amount": 150000,
            "description": "test",
            "callback_url": "http://localhost/callback",
        }
        assert result.authority == "S-authority"

    @patch("apps.subscriptions.gateways.zarinpal.urlopen")
    def test_already_verified_code_is_idempotent_success(self, mock_urlopen):
        response = MagicMock()
        response.read.return_value = json.dumps(
            {"data": {"code": 101, "ref_id": 9988, "message": "Already verified"}, "errors": []}
        ).encode()
        mock_urlopen.return_value.__enter__.return_value = response

        result = verify_payment(amount=Decimal("150000"), authority="S-authority")

        assert result.code == 101
        assert result.ref_id == "9988"
