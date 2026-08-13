from datetime import date, timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.music.models import RecentlyPlayed, Song, Stream
from apps.subscriptions.models import SubscriptionPlan, UserSubscription

from .factories import AlbumFactory, PlaylistFactory, PlaylistSongFactory, SongFactory

pytestmark = pytest.mark.django_db
PASSWORD = "VeryStrongPass908!"


def create_user(email=None, role=User.Role.LISTENER, username=None):
    if email is None:
        email = f"{role}_{User.objects.count()}@example.com"
    if username is None:
        username = f"{role}_{User.objects.count()}"
    return User.objects.create_user(
        email=email,
        password=PASSWORD,
        display_name=role.title(),
        birth_date=date(2000, 1, 1),
        role=role,
        username=username,
    )


def create_artist(email=None, username=None):
    if email is None:
        email = f"artist_{User.objects.count()}@example.com"
    if username is None:
        username = f"artist_{User.objects.count()}"
    return User.objects.create_user(
        email=email,
        password=PASSWORD,
        display_name="Artist",
        birth_date=date(1995, 6, 15),
        role=User.Role.ARTIST,
        username=username,
    )


def client_for(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


# ── Search API ─────────────────────────────────────────────────────────


class TestSearch:
    def test_search_songs_by_title(self):
        SongFactory(title="Bohemian Rhapsody")
        SongFactory(title="Another Song")
        response = APIClient().get("/api/v1/music/search/", {"q": "Bohemian"})
        assert response.status_code == 200
        assert len(response.data["songs"]) == 1
        assert response.data["songs"][0]["title"] == "Bohemian Rhapsody"

    def test_search_songs_by_artist_name(self):
        artist = create_artist(email="queen@example.com", username="queen_user")
        artist.display_name = "Queen"
        artist.save()
        SongFactory(title="Some Song", artist=artist)
        response = APIClient().get("/api/v1/music/search/", {"q": "Queen"})
        assert response.status_code == 200
        assert len(response.data["songs"]) == 1

    def test_search_albums_by_title(self):
        AlbumFactory(title="Dark Side of the Moon")
        AlbumFactory(title="Other Album")
        response = APIClient().get("/api/v1/music/search/", {"q": "Dark Side"})
        assert response.status_code == 200
        assert len(response.data["albums"]) == 1

    def test_search_playlists_by_title(self):
        PlaylistFactory(title="Road Trip Mix")
        PlaylistFactory(title="Other Playlist")
        response = APIClient().get("/api/v1/music/search/", {"q": "Road Trip"})
        assert response.status_code == 200
        assert len(response.data["playlists"]) == 1

    def test_search_playlists_by_description(self):
        PlaylistFactory(title="My Playlist", description="Best workout songs")
        response = APIClient().get("/api/v1/music/search/", {"q": "workout"})
        assert response.status_code == 200
        assert len(response.data["playlists"]) == 1

    def test_search_combined_results(self):
        SongFactory(title="Rock Song")
        AlbumFactory(title="Rock Album")
        PlaylistFactory(title="Rock Playlist")
        response = APIClient().get("/api/v1/music/search/", {"q": "Rock"})
        assert response.status_code == 200
        assert len(response.data["songs"]) == 1
        assert len(response.data["albums"]) == 1
        assert len(response.data["playlists"]) == 1

    def test_search_empty_query_returns_400(self):
        response = APIClient().get("/api/v1/music/search/", {"q": ""})
        assert response.status_code == 400

    def test_search_no_results(self):
        SongFactory(title="Hello")
        response = APIClient().get("/api/v1/music/search/", {"q": "xyznonexistent"})
        assert response.status_code == 200
        assert len(response.data["songs"]) == 0
        assert len(response.data["albums"]) == 0
        assert len(response.data["playlists"]) == 0

    def test_search_by_genre(self):
        SongFactory(title="Jazz Song", genre="Jazz")
        SongFactory(title="Rock Song", genre="Rock")
        response = APIClient().get("/api/v1/music/search/", {"q": "Jazz"})
        assert response.status_code == 200
        assert len(response.data["songs"]) == 1

    def test_search_case_insensitive(self):
        SongFactory(title="Bohemian Rhapsody")
        response = APIClient().get("/api/v1/music/search/", {"q": "bohemian"})
        assert response.status_code == 200
        assert len(response.data["songs"]) == 1


# ── Recently Played ────────────────────────────────────────────────────


class TestRecentlyPlayed:
    def test_record_recently_played(self):
        user = create_user()
        song = SongFactory()
        response = client_for(user).post(
            "/api/v1/music/recently-played/record/",
            {"song_id": str(song.pk)},
            format="json",
        )
        assert response.status_code == 201
        assert RecentlyPlayed.objects.filter(user=user, song=song).exists()

    def test_list_recently_played(self):
        user = create_user()
        s1 = SongFactory(title="First")
        s2 = SongFactory(title="Second")
        RecentlyPlayed.objects.create(user=user, song=s1)
        RecentlyPlayed.objects.create(user=user, song=s2)

        response = client_for(user).get("/api/v1/music/recently-played/")
        assert response.status_code == 200
        assert len(response.data) == 2

    def test_recently_played_ordered_by_time(self):
        user = create_user()
        s1 = SongFactory(title="Older")
        s2 = SongFactory(title="Newer")
        rp1 = RecentlyPlayed.objects.create(user=user, song=s1)
        rp2 = RecentlyPlayed.objects.create(user=user, song=s2)

        response = client_for(user).get("/api/v1/music/recently-played/")
        assert response.data[0]["song"] == s2.pk
        assert response.data[1]["song"] == s1.pk

    def test_recently_played_only_own(self):
        user = create_user(email="u1@example.com", username="u1")
        other = create_user(email="u2@example.com", username="u2")
        song = SongFactory()
        RecentlyPlayed.objects.create(user=other, song=song)

        response = client_for(user).get("/api/v1/music/recently-played/")
        assert response.status_code == 200
        assert len(response.data) == 0

    def test_recently_played_requires_auth(self):
        response = APIClient().get("/api/v1/music/recently-played/")
        assert response.status_code == 401

    def test_record_nonexistent_song_returns_404(self):
        import uuid

        user = create_user()
        response = client_for(user).post(
            "/api/v1/music/recently-played/record/",
            {"song_id": str(uuid.uuid4())},
            format="json",
        )
        assert response.status_code == 404


# ── Top Songs ──────────────────────────────────────────────────────────


class TestTopSongs:
    def test_top_songs_ordered_by_play_count(self):
        s1 = SongFactory(title="Low", play_count=10)
        s2 = SongFactory(title="High", play_count=100)
        s3 = SongFactory(title="Medium", play_count=50)

        response = APIClient().get("/api/v1/music/songs/top/")
        assert response.status_code == 200
        titles = [s["title"] for s in response.data]
        assert titles == ["High", "Medium", "Low"]

    def test_top_songs_limit(self):
        for i in range(10):
            SongFactory(title=f"Song {i}", play_count=i)

        response = APIClient().get("/api/v1/music/songs/top/", {"limit": 5})
        assert response.status_code == 200
        assert len(response.data) == 5

    def test_top_songs_excludes_zero_plays(self):
        SongFactory(title="Popular", play_count=10)
        SongFactory(title="Unpopular", play_count=0)

        response = APIClient().get("/api/v1/music/songs/top/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["title"] == "Popular"

    def test_top_songs_max_limit_100(self):
        for i in range(110):
            SongFactory(title=f"Song {i}", play_count=i)

        response = APIClient().get("/api/v1/music/songs/top/", {"limit": 200})
        assert response.status_code == 200
        assert len(response.data) == 100

    def test_top_songs_public(self):
        response = APIClient().get("/api/v1/music/songs/top/")
        assert response.status_code == 200


# ── Stream Status ──────────────────────────────────────────────────────


class TestStreamStatus:
    def test_stream_status_no_limit(self):
        user = create_user()
        response = client_for(user).get("/api/v1/music/streams/status/")
        assert response.status_code == 200
        assert response.data["streams_today"] == 0
        assert response.data["daily_limit"] is not None
        assert response.data["can_stream"] is True

    def test_stream_status_with_limit(self):
        user = create_user()
        plan = SubscriptionPlan.objects.get(code=SubscriptionPlan.Code.FREE)
        UserSubscription.objects.update_or_create(
            user=user,
            defaults={"plan": plan, "status": UserSubscription.Status.ACTIVE},
        )

        response = client_for(user).get("/api/v1/music/streams/status/")
        assert response.status_code == 200
        assert response.data["daily_limit"] == 60
        assert response.data["can_stream"] is True

    def test_stream_status_tracks_today_count(self):
        user = create_user()
        song = SongFactory()
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        Stream.objects.create(user=user, song=song)
        Stream.objects.create(user=user, song=song)

        response = client_for(user).get("/api/v1/music/streams/status/")
        assert response.status_code == 200
        assert response.data["streams_today"] == 2

    def test_stream_status_can_stream_false_at_limit(self):
        user = create_user()
        plan = SubscriptionPlan.objects.get(code=SubscriptionPlan.Code.FREE)
        UserSubscription.objects.update_or_create(
            user=user,
            defaults={"plan": plan, "status": UserSubscription.Status.ACTIVE},
        )

        song = SongFactory()
        for _ in range(60):
            Stream.objects.create(user=user, song=song)

        response = client_for(user).get("/api/v1/music/streams/status/")
        assert response.status_code == 200
        assert response.data["streams_today"] == 60
        assert response.data["can_stream"] is False

    def test_stream_status_requires_auth(self):
        response = APIClient().get("/api/v1/music/streams/status/")
        assert response.status_code == 401
