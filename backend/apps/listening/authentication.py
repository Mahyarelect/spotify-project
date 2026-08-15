from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import User


@database_sync_to_async
def _user_for_token(raw_token: str):
    try:
        token = AccessToken(raw_token)
        return User.objects.get(pk=token["user_id"], is_active=True)
    except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JwtSubprotocolAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        protocols = scope.get("subprotocols", [])
        token = protocols[1] if len(protocols) >= 2 and protocols[0] == "spotify.jwt" else ""
        scope["user"] = await _user_for_token(token) if token else AnonymousUser()
        return await self.app(scope, receive, send)
