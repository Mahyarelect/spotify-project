from datetime import date, timedelta

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.subscriptions.models import SubscriptionPlan


pytestmark = pytest.mark.django_db
PASSWORD = "VeryStrongPass908!"
URL = "/api/v1/users/search/"


def create_user(email, display_name, *, username=None, is_active=True, role=User.Role.LISTENER):
    user = User.objects.create_user(
        email=email,
        password=PASSWORD,
        display_name=display_name,
        birth_date=date(2000, 1, 1),
        role=role,
        is_active=is_active,
    )
    if username:
        user.username = username
        user.save(update_fields=("username",))
    return user


def authenticated_client(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def test_search_requires_authentication():
    assert APIClient().get(URL, {"q": "artist"}).status_code == 401


@pytest.mark.parametrize("query", ["", " ", "a", "x" * 101])
def test_search_validates_trimmed_query_length(query):
    viewer = create_user("viewer@example.com", "Viewer")
    response = authenticated_client(viewer).get(URL, {"q": query})

    assert response.status_code == 400
    assert "q" in response.data["error"]["fields"]


def test_search_matches_username_and_display_name_case_insensitively():
    viewer = create_user("viewer@example.com", "Viewer")
    by_username = create_user("one@example.com", "Unrelated", username="NeedleArtist")
    by_name = create_user("two@example.com", "The Needle Band", username="other_handle")

    response = authenticated_client(viewer).get(URL, {"q": "nEeDlE"})

    assert response.status_code == 200
    assert {item["id"] for item in response.data["results"]} == {
        str(by_username.id),
        str(by_name.id),
    }


def test_search_excludes_current_and_inactive_users():
    viewer = create_user("viewer@example.com", "Search Person", username="search_viewer")
    active = create_user("active@example.com", "Search Active")
    create_user("inactive@example.com", "Search Inactive", is_active=False)

    response = authenticated_client(viewer).get(URL, {"q": "search"})

    assert [item["id"] for item in response.data["results"]] == [str(active.id)]


def test_search_has_stable_exact_prefix_then_display_ordering():
    viewer = create_user("viewer@example.com", "Viewer")
    display = create_user("display@example.com", "Muse Person", username="zzz_handle")
    prefix = create_user("prefix@example.com", "Someone", username="muse_fan")
    exact = create_user("exact@example.com", "Someone Else", username="muse")

    response = authenticated_client(viewer).get(URL, {"q": "muse"})

    assert [item["id"] for item in response.data["results"]] == [
        str(exact.id),
        str(prefix.id),
        str(display.id),
    ]


def test_search_is_paginated():
    viewer = create_user("viewer@example.com", "Viewer")
    for index in range(12):
        create_user(f"match{index}@example.com", f"Pagination Match {index}")

    first = authenticated_client(viewer).get(URL, {"q": "pagination"})
    second = authenticated_client(viewer).get(URL, {"q": "pagination", "page": 2})

    assert first.data["count"] == 12
    assert len(first.data["results"]) == 10
    assert first.data["next"]
    assert len(second.data["results"]) == 2


def test_search_response_is_public_and_includes_follow_state():
    viewer = create_user("viewer@example.com", "Viewer")
    artist = create_user(
        "private-artist@example.com",
        "Visible Artist",
        username="visible_artist",
        role=User.Role.ARTIST,
    )
    artist.artist_verified = True
    artist.birth_date = date(1990, 1, 1)
    artist.save(update_fields=("artist_verified", "birth_date"))
    viewer.following.add(artist)
    artist.subscription.plan = SubscriptionPlan.objects.get(code=SubscriptionPlan.Code.GOLD)
    artist.subscription.status = "active"
    artist.subscription.expires_at = timezone.now() + timedelta(days=30)
    artist.subscription.save()

    response = authenticated_client(viewer).get(URL, {"q": "visible"})
    item = response.data["results"][0]

    assert item["is_following"] is True
    assert item["artist_verified"] is True
    assert item["plan_name"] == "gold"
    assert not {
        "email",
        "birth_date",
        "gender",
        "preferences",
        "subscription",
        "expires_at",
        "is_staff",
    } & item.keys()


def test_search_reports_false_when_not_followed():
    viewer = create_user("viewer@example.com", "Viewer")
    create_user("target@example.com", "Target Person")

    response = authenticated_client(viewer).get(URL, {"q": "target"})

    assert response.data["results"][0]["is_following"] is False


def test_search_query_count_does_not_grow_per_result():
    viewer = create_user("viewer@example.com", "Viewer")
    for index in range(10):
        create_user(f"bounded{index}@example.com", f"Bounded Result {index}")
    client = authenticated_client(viewer)

    with CaptureQueriesContext(connection) as queries:
        response = client.get(URL, {"q": "bounded"})

    assert response.status_code == 200
    assert len(response.data["results"]) == 10
    assert len(queries) <= 3
