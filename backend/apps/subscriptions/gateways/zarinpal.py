import json
from dataclasses import dataclass
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

from apps.common.domain import DomainError


@dataclass(frozen=True)
class PaymentRequestResult:
    code: int
    authority: str
    message: str


@dataclass(frozen=True)
class PaymentVerificationResult:
    code: int
    ref_id: str
    message: str


def _amount_as_rials(amount: Decimal) -> int:
    integral = amount.to_integral_value()
    if amount != integral or integral <= 0:
        raise DomainError(
            "invalid_gateway_amount",
            "Zarinpal requires a positive whole-number amount in rials.",
            status_code=409,
        )
    return int(integral)


def _post_json(path: str, payload: dict) -> dict:
    request = Request(
        f"{settings.ZARINPAL_API_BASE_URL.rstrip('/')}/{path.lstrip('/')}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=settings.ZARINPAL_TIMEOUT_SECONDS) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise DomainError(
            "payment_gateway_unavailable",
            "The payment gateway is temporarily unavailable.",
            status_code=502,
        ) from error
    if not isinstance(body, dict):
        raise DomainError("invalid_gateway_response", "The payment gateway returned an invalid response.", status_code=502)
    return body


def _response_parts(response: dict) -> tuple[dict, dict]:
    data = response.get("data")
    errors = response.get("errors")
    return (data if isinstance(data, dict) else {}, errors if isinstance(errors, dict) else {})


def _response_code(data: dict, errors: dict) -> int:
    try:
        return int(data.get("code") or errors.get("code") or 0)
    except (TypeError, ValueError) as error:
        raise DomainError("invalid_gateway_response", "The gateway returned an invalid status code.", status_code=502) from error


def request_payment(*, amount: Decimal, description: str, callback_url: str) -> PaymentRequestResult:
    response = _post_json(
        "request.json",
        {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": _amount_as_rials(amount),
            "description": description,
            "callback_url": callback_url,
        },
    )
    data, errors = _response_parts(response)
    code = _response_code(data, errors)
    authority = str(data.get("authority") or "")
    message = str(data.get("message") or errors.get("message") or "Payment request failed.")
    if code != 100 or not authority:
        raise DomainError("payment_request_rejected", message, status_code=502)
    return PaymentRequestResult(code=code, authority=authority, message=message)


def verify_payment(*, amount: Decimal, authority: str) -> PaymentVerificationResult:
    response = _post_json(
        "verify.json",
        {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": _amount_as_rials(amount),
            "authority": authority,
        },
    )
    data, errors = _response_parts(response)
    code = _response_code(data, errors)
    message = str(data.get("message") or errors.get("message") or "Payment verification failed.")
    if code not in {100, 101}:
        raise DomainError("payment_verification_failed", message, status_code=409)
    ref_id = str(data.get("ref_id") or "")
    if not ref_id:
        raise DomainError("invalid_gateway_response", "The gateway omitted the payment reference.", status_code=502)
    return PaymentVerificationResult(code=code, ref_id=ref_id, message=message)


def start_pay_url(authority: str) -> str:
    return f"{settings.ZARINPAL_START_PAY_BASE_URL.rstrip('/')}/{authority}"
