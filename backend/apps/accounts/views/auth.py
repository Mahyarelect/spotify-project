from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from apps.common.domain import DomainError

from ..models import ArtistApplication
from ..selectors import get_current_user, get_user_by_email_ci
from ..serializers.artist_application import ArtistApplicationSerializer
from ..serializers.auth import (
    ArtistApplicationCreateSerializer,
    ListenerRegistrationSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)
from ..serializers.profile import CurrentUserSerializer
from ..services import register_listener, send_password_reset, submit_artist_application


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ListenerRegistrationSerializer

    @extend_schema(
        responses={
            201: inline_serializer(
                "AuthResponse",
                fields={
                    "access": serializers.CharField(),
                    "refresh": serializers.CharField(),
                    "user": CurrentUserSerializer(),
                },
            )
        }
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = register_listener(
            display_name=data["display_name"],
            email=data["email"],
            password=data["password"],
            birth_date=data["birth_date"],
            gender=data["gender"],
        )
        user = get_current_user(user.id)
        return Response(
            {**_tokens_for(user), "user": CurrentUserSerializer(user, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )


class ArtistApplicationCreateView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ArtistApplicationCreateSerializer

    @extend_schema(responses={201: ArtistApplicationSerializer})
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        application = submit_artist_application(
            email=data["email"],
            password=data["password"],
            artist_name=data["artist_name"],
            portfolio_url=data["portfolio_url"],
        )
        return Response(ArtistApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


class LoginView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    @extend_schema(
        responses={
            200: inline_serializer(
                "LoginResponse",
                fields={
                    "access": serializers.CharField(),
                    "refresh": serializers.CharField(),
                    "user": CurrentUserSerializer(),
                },
            )
        }
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = get_user_by_email_ci(data["email"])
        if user is None or not user.check_password(data["password"]):
            raise DomainError("invalid_credentials", "Invalid email or password.", status_code=401)
        if not user.is_active:
            application = ArtistApplication.objects.filter(user=user).first()
            if application and application.status == ArtistApplication.Status.PENDING:
                raise DomainError("artist_application_pending", "Your artist application is pending review.", status_code=403)
            if application and application.status == ArtistApplication.Status.REJECTED:
                raise DomainError("artist_application_rejected", "Your artist application was rejected.", status_code=403)
            raise DomainError("account_inactive", "This account is inactive.", status_code=403)
        user.last_login = timezone.now()
        user.save(update_fields=("last_login",))
        current_user = get_current_user(user.id)
        return Response(
            {**_tokens_for(user), "user": CurrentUserSerializer(current_user, context={"request": request}).data}
        )


class RefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)


class LogoutView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = LogoutSerializer

    @extend_schema(responses={204: None})
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError as error:
            raise DomainError("invalid_refresh_token", "The refresh token is invalid.") from error
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetRequestSerializer

    @extend_schema(
        responses={202: inline_serializer("PasswordResetAccepted", fields={"message": serializers.CharField()})}
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_by_email_ci(serializer.validated_data["email"])
        if user is not None and user.is_active:
            send_password_reset(user=user, frontend_origin=settings.FRONTEND_ORIGIN)
        return Response(
            {"message": "If an account exists for this email, a reset link has been sent."},
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetConfirmView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    @extend_schema(responses={204: None})
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=("password", "updated_at"))
        return Response(status=status.HTTP_204_NO_CONTENT)
