from datetime import date, timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.music.models import Playlist, Song, Stream
from apps.subscriptions.models import SubscriptionPlan, UserSubscription

from .factories import AlbumFactory, PlaylistFactory, SongFactory

pytestmark = pytest.mark.django_db


def user(role=User.Role.LISTENER, verified=False):
    index = User.objects.count()
    return User.objects.create_user(
        email=f"entitlement-{index}@example.com",
        username=f"entitlement-{index}",
        password="VeryStrongPass908!",
        display_name="Entitlement User",
        birth_date=date(2000, 1, 1),
        role=role,
        artist_verified=verified,
    )


def client_for(subject):
    client = APIClient()
    client.force_authenticate(subject)
    return client


def assign_plan(subject, code):
    plan = SubscriptionPlan.objects.get(code=code)
    UserSubscription.objects.update_or_create(
        user=subject,
        defaults={
            "plan": plan,
            "status": UserSubscription.Status.ACTIVE,
            "expires_at": timezone.now() + timedelta(days=30) if code != "free" else None,
        },
    )
    return plan


def test_playlist_limit_is_enforced_by_creation_endpoint():
    listener = user()
    plan = assign_plan(listener, SubscriptionPlan.Code.FREE)
    plan.max_playlists = 1
    plan.save(update_fields=("max_playlists",))
    PlaylistFactory(created_by=listener)

    response = client_for(listener).post(
        "/api/v1/music/playlists/", {"title": "One too many", "cover_color": "#123456"}, format="json"
    )

    assert response.status_code == 403
    assert response.data["error"]["code"] == "playlist_limit_reached"
    assert Playlist.objects.filter(created_by=listener).count() == 1


def test_daily_stream_limit_prevents_record_and_play_count_increment():
    listener = user()
    plan = assign_plan(listener, SubscriptionPlan.Code.FREE)
    plan.daily_stream_limit = 1
    plan.save(update_fields=("daily_stream_limit",))
    song = SongFactory(play_count=7)
    Stream.objects.create(user=listener, song=song)

    response = client_for(listener).post("/api/v1/music/streams/", {"song_id": str(song.id)}, format="json")

    song.refresh_from_db()
    assert response.status_code == 403
    assert response.data["error"]["code"] == "daily_stream_limit_reached"
    assert Stream.objects.filter(user=listener).count() == 1
    assert song.play_count == 7


def test_early_access_catalog_requires_gold_entitlement():
    album = AlbumFactory(is_early_access=True)
    song = SongFactory(album=album, artist=album.artist)
    assert APIClient().get(f"/api/v1/music/albums/{album.id}/").status_code == 404
    assert APIClient().get(f"/api/v1/music/songs/{song.id}/").status_code == 404

    unrelated_artist = user(User.Role.ARTIST, verified=True)
    assert client_for(unrelated_artist).get(f"/api/v1/music/albums/{album.id}/").status_code == 404
    assert client_for(album.artist).get(f"/api/v1/music/albums/{album.id}/").status_code == 200

    listener = user()
    assign_plan(listener, SubscriptionPlan.Code.GOLD)
    assert client_for(listener).get(f"/api/v1/music/albums/{album.id}/").status_code == 200
    assert client_for(listener).get(f"/api/v1/music/songs/{song.id}/").status_code == 200


def test_artist_statistics_are_hidden_without_gold():
    artist = user(User.Role.ARTIST, verified=True)
    SongFactory(artist=artist, play_count=12)
    public = APIClient().get(f"/api/v1/music/artists/{artist.username}/")
    assert public.status_code == 200
    assert public.data["total_streams"] is None

    listener = user()
    assign_plan(listener, SubscriptionPlan.Code.GOLD)
    entitled = client_for(listener).get(f"/api/v1/music/artists/{artist.username}/")
    assert entitled.data["total_streams"] == 12


def test_song_collaborators_are_persisted_and_serialized():
    artist = user(User.Role.ARTIST, verified=True)
    response = client_for(artist).post(
        "/api/v1/music/songs/",
        {"title": "Together", "duration_sec": 180, "cover_color": "#123456", "collaborators": ["A", "B"]},
        format="json",
    )
    assert response.status_code == 201
    assert response.data["collaborators"] == ["A", "B"]
    assert Song.objects.get(pk=response.data["id"]).collaborators == ["A", "B"]
