from collections.abc import Mapping, Sequence

from rest_framework.exceptions import ErrorDetail
from rest_framework.views import exception_handler


def _plain(value):
    if isinstance(value, ErrorDetail):
        return str(value)
    if isinstance(value, Mapping):
        return {key: _plain(item) for key, item in value.items()}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
        return [_plain(item) for item in value]
    return value


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    if isinstance(data, Mapping) and "error" in data:
        return response

    detail = data.get("detail") if isinstance(data, Mapping) else None
    if isinstance(detail, ErrorDetail):
        code = detail.code
        message = str(detail)
        fields = None
    else:
        code = "validation_error" if response.status_code == 400 else "request_error"
        message = "Please correct the highlighted fields." if response.status_code == 400 else "Request failed."
        fields = _plain(data) if isinstance(data, Mapping) else None

    response.data = {
        "error": {
            "code": code,
            "message": message,
            **({"fields": fields} if fields else {}),
        }
    }
    return response
