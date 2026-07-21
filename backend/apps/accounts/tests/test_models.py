from datetime import date
from unittest.mock import patch

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.accounts.models import ArtistApplication, User, UserPreference


pytestmark = pytest.mark.django_db


def user_data(**overrides):
    data = {
        "email": "Listener@Example.COM ",
        "password": "Password123!",
        "display_name": "Test Listener",
        "birth_date": date(2000, 1, 1),
    }
    data.update(overrides)
    return data


def test_manager_normalizes_email_and_hashes_password():
    user = User.objects.create_user(**user_data())

    assert user.email == "listener@example.com"
    assert user.password != "Password123!"
    assert user.check_password("Password123!")


def test_manager_generates_unique_public_handles():
    with patch("apps.accounts.managers.secrets.token_hex", side_effect=["aaaa", "aaaa", "bbbb"]):
        first = User.objects.create_user(**user_data())
        second = User.objects.create_user(**user_data(email="other@example.com"))

    assert first.username == "test_listener_aaaa"
    assert second.username == "test_listener_bbbb"


def test_case_insensitive_email_constraint():
    User.objects.create_user(**user_data(email="duplicate@example.com"))

    with pytest.raises(IntegrityError):
        User.objects.create_user(**user_data(email="DUPLICATE@example.com"))


def test_create_support_user_sets_consistent_flags():
    user = User.objects.create_support_user(**user_data(email="support@example.com"))

    assert user.role == User.Role.SUPPORT
    assert user.is_staff is True
    assert user.is_superuser is False


def test_create_superuser_sets_admin_role():
    user = User.objects.create_superuser(**user_data(email="admin@example.com"))

    assert user.role == User.Role.ADMIN
    assert user.is_staff is True
    assert user.is_superuser is True


def test_role_consistency_is_validated():
    user = User(**user_data(email="invalid@example.com", role=User.Role.LISTENER, is_staff=True))

    with pytest.raises(ValidationError):
        user.full_clean()


def test_preference_defaults_match_frontend_contract():
    user = User.objects.create_user(**user_data())
    preferences = user.preferences

    assert preferences.notify_new_releases is True
    assert preferences.notify_subscription_expiry is True
    assert preferences.notify_ticket_updates is False
    assert preferences.sound_enabled is True
    assert preferences.language == UserPreference.Language.ENGLISH


def test_artist_application_is_linked_to_inactive_artist():
    artist = User.objects.create_user(
        **user_data(email="artist@example.com", role=User.Role.ARTIST, is_active=False)
    )
    application = ArtistApplication.objects.create(
        user=artist,
        artist_name="Test Artist",
        portfolio_url="https://example.com/portfolio",
    )

    assert application.status == ArtistApplication.Status.PENDING
    assert application.user.role == User.Role.ARTIST
    assert application.user.is_active is False
