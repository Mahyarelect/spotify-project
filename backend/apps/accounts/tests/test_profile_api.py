from datetime import date, timedelta
from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.subscriptions.models import SubscriptionPlan


pytestmark = pytest.mark.django_db
PASSWORD = "VeryStrongPass908!"


def create_user(email="user@example.com", display_name="User"):
    return User.objects.create_user(
        email=email,
        password=PASSWORD,
        display_name=display_name,
        birth_date=date(2000, 1, 1),
    )


def authenticated_client(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def image_upload(name="avatar.png", image_format="PNG"):
    buffer = BytesIO()
    Image.new("RGB", (8, 8), color="green").save(buffer, format=image_format)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=f"image/{image_format.lower()}")


def upgrade(user, plan="silver"):
    user.subscription.plan = SubscriptionPlan.objects.get(code=plan)
    user.subscription.expires_at = timezone.now() + timedelta(days=30)
    user.subscription.save()


def test_private_profile_contains_expected_fields_but_no_secrets():
    user = create_user()
    response = authenticated_client(user).get("/api/v1/users/me/")

    assert response.status_code == 200
    assert {"email", "birth_date", "gender", "preferences", "subscription"} <= response.data.keys()
    assert not {"password", "is_staff", "is_superuser", "groups", "user_permissions"} & response.data.keys()
    assert response.data["streams_today"] is None


def test_public_profile_excludes_private_fields():
    target = create_user("artist@example.com", "Artist")
    response = APIClient().get(f"/api/v1/users/{target.username}/")

    assert response.status_code == 200
    assert not {"email", "birth_date", "gender", "preferences", "subscription", "is_staff"} & response.data.keys()
    assert response.data["is_following"] is False


def test_user_can_patch_only_allowed_profile_fields():
    user = create_user()
    response = authenticated_client(user).patch(
        "/api/v1/users/me/",
        {"display_name": "Updated", "bio": "New bio"},
        format="json",
    )

    user.refresh_from_db()
    assert response.status_code == 200
    assert (user.display_name, user.bio) == ("Updated", "New bio")


def test_privileged_profile_fields_are_rejected():
    user = create_user()
    response = authenticated_client(user).patch(
        "/api/v1/users/me/",
        {"role": "admin", "artist_verified": True},
        format="json",
    )

    user.refresh_from_db()
    assert response.status_code == 400
    assert user.role == User.Role.LISTENER
    assert user.artist_verified is False


def test_free_user_avatar_upload_is_rejected(tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    user = create_user()
    response = authenticated_client(user).patch(
        "/api/v1/users/me/",
        {"display_name": "Should Roll Back", "avatar": image_upload()},
        format="multipart",
    )

    user.refresh_from_db()
    assert response.status_code == 403
    assert response.data["error"]["code"] == "profile_image_not_allowed"
    assert user.display_name == "User"


def test_paid_user_can_upload_valid_avatar(tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    user = create_user()
    upgrade(user)
    response = authenticated_client(user).patch(
        "/api/v1/users/me/",
        {"avatar": image_upload()},
        format="multipart",
    )

    user.refresh_from_db()
    assert response.status_code == 200
    assert user.avatar.name.startswith(f"avatars/{user.pk}/")
    assert (tmp_path / user.avatar.name).exists()


@pytest.mark.parametrize(
    "upload",
    [
        SimpleUploadedFile("fake.png", b"not an image", content_type="image/png"),
        SimpleUploadedFile("large.png", b"x" * (5 * 1024 * 1024 + 1), content_type="image/png"),
    ],
)
def test_invalid_or_oversized_avatar_is_rejected(upload, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    user = create_user()
    upgrade(user)

    response = authenticated_client(user).patch(
        "/api/v1/users/me/", {"avatar": upload}, format="multipart"
    )

    assert response.status_code == 400
    assert "avatar" in response.data["error"]["fields"]


def test_follow_and_unfollow_are_idempotent():
    viewer = create_user("viewer@example.com", "Viewer")
    target = create_user("target@example.com", "Target")
    client = authenticated_client(viewer)
    url = f"/api/v1/users/{target.username}/follow/"

    first = client.post(url)
    second = client.post(url)
    unfollowed = client.delete(url)
    repeated = client.delete(url)

    assert first.data["followers_count"] == second.data["followers_count"] == 1
    assert first.data["is_following"] is True
    assert unfollowed.data["followers_count"] == repeated.data["followers_count"] == 0
    assert repeated.data["is_following"] is False


def test_self_follow_is_rejected():
    user = create_user()
    response = authenticated_client(user).post(f"/api/v1/users/{user.username}/follow/")

    assert response.status_code == 400
    assert response.data["error"]["code"] == "self_follow_not_allowed"


def test_preferences_partial_patch_persists_and_rejects_unknown_fields():
    user = create_user()
    client = authenticated_client(user)

    updated = client.patch(
        "/api/v1/users/me/preferences/",
        {"sound_enabled": False, "language": "fa"},
        format="json",
    )
    invalid = client.patch("/api/v1/users/me/preferences/", {"role": "admin"}, format="json")

    user.preferences.refresh_from_db()
    assert updated.status_code == 200
    assert user.preferences.sound_enabled is False
    assert user.preferences.language == "fa"
    assert invalid.status_code == 400


def test_account_deletion_requires_current_password():
    user = create_user()
    client = authenticated_client(user)

    wrong = client.delete("/api/v1/users/me/", {"current_password": "wrong"}, format="json")
    correct = client.delete("/api/v1/users/me/", {"current_password": PASSWORD}, format="json")

    assert wrong.status_code == 400
    assert correct.status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()


def test_current_profile_query_count_is_bounded():
    user = create_user()
    client = authenticated_client(user)

    with CaptureQueriesContext(connection) as queries:
        response = client.get("/api/v1/users/me/")

    assert response.status_code == 200
    assert len(queries) <= 3
