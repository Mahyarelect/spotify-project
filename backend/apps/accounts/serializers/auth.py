from datetime import date

from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from apps.common.domain import DomainError

from ..models import User


def validate_new_password(password: str, *, user=None) -> str:
    try:
        validate_password(password, user=user)
    except DjangoValidationError as error:
        raise serializers.ValidationError(list(error.messages)) from error
    return password


def validate_password_confirmation(attrs):
    if attrs.get("password") != attrs.get("password_confirm"):
        raise serializers.ValidationError({"password_confirm": ["Passwords do not match."]})
    return attrs


class ListenerRegistrationSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)
    birth_date = serializers.DateField()
    gender = serializers.ChoiceField(choices=User.Gender.choices)
    accept_policy = serializers.BooleanField()

    def validate_email(self, value):
        return User.objects.normalize_login_email(value)

    def validate_birth_date(self, value):
        today = date.today()
        if value > today:
            raise serializers.ValidationError("Birth date cannot be in the future.")
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 13:
            raise serializers.ValidationError("You must be at least 13 years old.")
        if age > 120:
            raise serializers.ValidationError("Please enter a valid birth date.")
        return value

    def validate(self, attrs):
        validate_password_confirmation(attrs)
        if not attrs["accept_policy"]:
            raise serializers.ValidationError({"accept_policy": ["You must accept the privacy policy."]})
        candidate = User(email=attrs["email"], display_name=attrs["display_name"])
        validate_new_password(attrs["password"], user=candidate)
        return attrs


class ArtistApplicationCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)
    artist_name = serializers.CharField(max_length=150)
    portfolio_url = serializers.URLField()

    def validate_email(self, value):
        return User.objects.normalize_login_email(value)

    def validate(self, attrs):
        validate_password_confirmation(attrs)
        candidate = User(email=attrs["email"], display_name=attrs["artist_name"], role=User.Role.ARTIST)
        validate_new_password(attrs["password"], user=candidate)
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return User.objects.normalize_login_email(value)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return User.objects.normalize_login_email(value)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        validate_password_confirmation(attrs)
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (ValueError, TypeError, OverflowError, User.DoesNotExist) as error:
            raise DomainError("invalid_reset_token", "This password reset link is invalid or expired.") from error
        if not default_token_generator.check_token(user, attrs["token"]):
            raise DomainError("invalid_reset_token", "This password reset link is invalid or expired.")
        validate_new_password(attrs["password"], user=user)
        attrs["user"] = user
        return attrs
