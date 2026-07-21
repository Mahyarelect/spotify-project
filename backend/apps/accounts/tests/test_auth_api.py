from datetime import date, timedelta
import re

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

from apps.accounts.models import ArtistApplication, User


pytestmark = pytest.mark.django_db
PASSWORD = "VeryStrongPass908!"


def registration_payload(**overrides):
    payload = {
        "display_name": "New Listener",
        "email": "Listener@Example.COM ",
        "password": PASSWORD,
        "password_confirm": PASSWORD,
        "birth_date": "2000-04-20",
        "gender": "other",
        "accept_policy": True,
    }
    payload.update(overrides)
    return payload


def create_user(email="user@example.com", role=User.Role.LISTENER, **overrides):
    data = {
        "email": email,
        "password": PASSWORD,
        "display_name": role.title(),
        "birth_date": date(2000, 1, 1),
        "role": role,
        "is_staff": role in {User.Role.SUPPORT, User.Role.ADMIN},
        "is_superuser": role == User.Role.ADMIN,
        "artist_verified": role == User.Role.ARTIST,
    }
    data.update(overrides)
    return User.objects.create_user(**data)


def artist_payload(**overrides):
    payload = {
        "email": "artist@example.com",
        "password": PASSWORD,
        "password_confirm": PASSWORD,
        "artist_name": "Example Artist",
        "portfolio_url": "https://example.com/portfolio",
    }
    payload.update(overrides)
    return payload


def test_listener_registration_creates_defaults_and_tokens():
    response = APIClient().post("/api/v1/auth/register/", registration_payload(), format="json")

    assert response.status_code == 201
    assert {"access", "refresh", "user"} <= response.data.keys()
    user = User.objects.get()
    assert user.email == "listener@example.com"
    assert user.check_password(PASSWORD)
    assert user.preferences.language == "en"
    assert user.subscription.plan.code == "free"
    assert "password" not in response.data["user"]


def test_duplicate_email_is_case_insensitive_conflict():
    create_user(email="listener@example.com")
    response = APIClient().post("/api/v1/auth/register/", registration_payload(), format="json")

    assert response.status_code == 409
    assert response.data["error"]["code"] == "email_exists"


@pytest.mark.parametrize(
    ("patch", "field"),
    [
        ({"password_confirm": "different"}, "password_confirm"),
        ({"birth_date": (date.today() + timedelta(days=1)).isoformat()}, "birth_date"),
        ({"birth_date": (date.today() - timedelta(days=365 * 10)).isoformat()}, "birth_date"),
        ({"birth_date": "1880-01-01"}, "birth_date"),
        ({"accept_policy": False}, "accept_policy"),
    ],
)
def test_registration_validation(patch, field):
    response = APIClient().post("/api/v1/auth/register/", registration_payload(**patch), format="json")

    assert response.status_code == 400
    assert field in response.data["error"]["fields"]


@pytest.mark.parametrize("role", list(User.Role.values))
def test_active_roles_can_login(role):
    user = create_user(email=f"{role}@example.com", role=role)

    response = APIClient().post(
        "/api/v1/auth/login/",
        {"email": user.email.upper(), "password": PASSWORD},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["user"]["role"] == role


def test_unknown_email_and_wrong_password_are_indistinguishable():
    user = create_user()
    unknown = APIClient().post(
        "/api/v1/auth/login/", {"email": "missing@example.com", "password": PASSWORD}, format="json"
    )
    wrong = APIClient().post(
        "/api/v1/auth/login/", {"email": user.email, "password": "WrongPass908!"}, format="json"
    )

    assert unknown.status_code == wrong.status_code == 401
    assert unknown.data == wrong.data


def test_pending_artist_cannot_login():
    client = APIClient()
    application_response = client.post("/api/v1/auth/artist-applications/", artist_payload(), format="json")
    login_response = client.post(
        "/api/v1/auth/login/", {"email": "artist@example.com", "password": PASSWORD}, format="json"
    )

    assert application_response.status_code == 201
    assert login_response.status_code == 403
    assert login_response.data["error"]["code"] == "artist_application_pending"


def test_refresh_rotates_and_blacklists_old_token():
    user = create_user()
    login = APIClient().post(
        "/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json"
    )
    old_refresh = login.data["refresh"]

    response = APIClient().post("/api/v1/auth/token/refresh/", {"refresh": old_refresh}, format="json")

    assert response.status_code == 200
    assert response.data["refresh"] != old_refresh
    assert BlacklistedToken.objects.count() == 1
    reuse = APIClient().post("/api/v1/auth/token/refresh/", {"refresh": old_refresh}, format="json")
    assert reuse.status_code == 401


def test_logout_blacklists_refresh_token():
    user = create_user()
    login = APIClient().post(
        "/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json"
    )
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    response = client.post("/api/v1/auth/logout/", {"refresh": login.data["refresh"]}, format="json")

    assert response.status_code == 204
    assert BlacklistedToken.objects.count() == 1


def test_password_reset_request_does_not_enumerate_accounts(settings):
    create_user(email="known@example.com")
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    known = APIClient().post("/api/v1/auth/password-reset/", {"email": "known@example.com"}, format="json")
    missing = APIClient().post("/api/v1/auth/password-reset/", {"email": "missing@example.com"}, format="json")

    assert known.status_code == missing.status_code == 202
    assert known.data == missing.data
    assert len(mail.outbox) == 1
    assert not re.search(r'"token"\s*:', str(known.data))


def test_password_reset_confirm_changes_password_and_prevents_reuse():
    user = create_user()
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    payload = {"uid": uid, "token": token, "password": "EvenStrongerPass321!", "password_confirm": "EvenStrongerPass321!"}

    first = APIClient().post("/api/v1/auth/password-reset/confirm/", payload, format="json")
    second = APIClient().post("/api/v1/auth/password-reset/confirm/", payload, format="json")

    user.refresh_from_db()
    assert first.status_code == 204
    assert user.check_password("EvenStrongerPass321!")
    assert second.status_code == 400
    assert second.data["error"]["code"] == "invalid_reset_token"


def test_artist_application_creates_inactive_artist_without_password_output():
    response = APIClient().post("/api/v1/auth/artist-applications/", artist_payload(), format="json")

    user = User.objects.get(email="artist@example.com")
    assert response.status_code == 201
    assert set(response.data) == {"id", "status", "submitted_at"}
    assert user.role == User.Role.ARTIST
    assert user.is_active is False
    assert user.check_password(PASSWORD)


def test_duplicate_pending_artist_application_is_rejected():
    client = APIClient()
    client.post("/api/v1/auth/artist-applications/", artist_payload(), format="json")

    response = client.post("/api/v1/auth/artist-applications/", artist_payload(), format="json")

    assert response.status_code == 409
    assert response.data["error"]["code"] == "artist_application_exists"


def test_support_can_reject_and_applicant_can_resubmit():
    client = APIClient()
    created = client.post("/api/v1/auth/artist-applications/", artist_payload(), format="json")
    support = create_user("support@example.com", User.Role.SUPPORT)
    client.force_authenticate(support)
    rejected = client.post(
        f"/api/v1/admin/artist-applications/{created.data['id']}/reject/",
        {"reason": "Portfolio needs more work."},
        format="json",
    )
    client.force_authenticate(user=None)
    resubmitted = client.post("/api/v1/auth/artist-applications/", artist_payload(artist_name="New Name"), format="json")

    assert rejected.status_code == 200
    assert resubmitted.status_code == 201
    assert ArtistApplication.objects.get().status == ArtistApplication.Status.PENDING
    assert User.objects.get(email="artist@example.com").display_name == "New Name"


def test_artist_rejection_requires_reason():
    client = APIClient()
    created = client.post("/api/v1/auth/artist-applications/", artist_payload(), format="json")
    client.force_authenticate(create_user("support@example.com", User.Role.SUPPORT))

    response = client.post(
        f"/api/v1/admin/artist-applications/{created.data['id']}/reject/",
        {"reason": ""},
        format="json",
    )

    assert response.status_code == 400
    assert response.data["error"]["code"] == "rejection_reason_required"


def test_support_approval_activates_and_verifies_artist():
    client = APIClient()
    created = client.post("/api/v1/auth/artist-applications/", artist_payload(), format="json")
    support = create_user("support@example.com", User.Role.SUPPORT)
    client.force_authenticate(support)

    response = client.post(f"/api/v1/admin/artist-applications/{created.data['id']}/approve/", format="json")

    artist = User.objects.get(email="artist@example.com")
    assert response.status_code == 200
    assert artist.is_active is True
    assert artist.artist_verified is True


def test_listener_cannot_review_artist_application():
    client = APIClient()
    created = client.post("/api/v1/auth/artist-applications/", artist_payload(), format="json")
    client.force_authenticate(create_user())

    response = client.post(f"/api/v1/admin/artist-applications/{created.data['id']}/approve/", format="json")

    assert response.status_code == 403
