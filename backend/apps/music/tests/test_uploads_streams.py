from datetime import date, timedelta
from decimal import Decimal
from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.music.models import Song, Stream
from apps.subscriptions.models import SubscriptionPlan, UserSubscription

from .factories import AlbumFactory, SongFactory

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
        artist_verified=True,
    )


def client_for(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def assign_plan(user, code):
    plan = SubscriptionPlan.objects.get(code=code)
    expires = timezone.now() + timedelta(days=30) if code != SubscriptionPlan.Code.FREE else None
    UserSubscription.objects.update_or_create(
        user=user,
        defaults={"plan": plan, "status": UserSubscription.Status.ACTIVE, "expires_at": expires},
    )


def fake_audio(name="test.mp3"):
    return SimpleUploadedFile(name, b"fake audio content", content_type="audio/mpeg")


def fake_image(name="cover.jpg"):
    from io import BytesIO

    from PIL import Image

    buf = BytesIO()
    Image.new("RGB", (1, 1), color="red").save(buf, format="JPEG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/jpeg")


# ── Audio Upload ────────────────────────────────────────────────────────


class TestSongAudioUpload:
    def test_upload_audio_as_owner(self):
        artist = create_artist()
        song = SongFactory(artist=artist)
        audio = fake_audio()
        response = client_for(artist).put(
            f"/api/v1/music/songs/{song.pk}/upload-audio/",
            {"audio_file": audio},
            format="multipart",
        )
        assert response.status_code == 200
        assert response.data["has_audio"] is True
        song.refresh_from_db()
        assert song.audio_file is not None

    def test_upload_audio_as_non_owner_forbidden(self):
        song = SongFactory()
        other = create_user()
        response = client_for(other).put(
            f"/api/v1/music/songs/{song.pk}/upload-audio/",
            {"audio_file": fake_audio()},
            format="multipart",
        )
        assert response.status_code == 404

    def test_upload_audio_requires_auth(self):
        song = SongFactory()
        response = APIClient().put(
            f"/api/v1/music/songs/{song.pk}/upload-audio/",
            {"audio_file": fake_audio()},
            format="multipart",
        )
        assert response.status_code == 401

    def test_upload_audio_requires_file(self):
        artist = create_artist()
        song = SongFactory(artist=artist)
        response = client_for(artist).put(
            f"/api/v1/music/songs/{song.pk}/upload-audio/",
            {},
            format="multipart",
        )
        assert response.status_code == 400

    @pytest.mark.parametrize(
        ("name", "content_type"),
        (("track.exe", "application/octet-stream"), ("track.mp3", "text/plain")),
    )
    def test_rejects_unsupported_or_mismatched_audio(self, name, content_type):
        artist = create_artist()
        song = SongFactory(artist=artist)
        audio = SimpleUploadedFile(name, b"not audio", content_type=content_type)
        response = client_for(artist).put(
            f"/api/v1/music/songs/{song.pk}/upload-audio/",
            {"audio_file": audio},
            format="multipart",
        )
        assert response.status_code == 400

    def test_unverified_artist_cannot_upload_audio(self):
        artist = create_artist()
        artist.artist_verified = False
        artist.save(update_fields=("artist_verified",))
        song = SongFactory(artist=artist)
        response = client_for(artist).put(
            f"/api/v1/music/songs/{song.pk}/upload-audio/",
            {"audio_file": fake_audio()},
            format="multipart",
        )
        assert response.status_code == 403


# ── Cover Image Upload ──────────────────────────────────────────────────


class TestCoverImageUpload:
    def test_upload_album_cover_on_create(self):
        artist = create_artist()
        payload = {
            "title": "Album With Cover",
            "cover_color": "#FF0000",
            "release_date": "2024-01-01",
            "cover_image": fake_image(),
        }
        response = client_for(artist).post("/api/v1/music/albums/", payload, format="multipart")
        assert response.status_code == 201
        assert response.data["cover_image"] is not None

    def test_upload_song_cover_on_create(self):
        artist = create_artist()
        payload = {
            "title": "Song With Cover",
            "duration_sec": 180,
            "cover_color": "#00FF00",
            "cover_image": fake_image(),
        }
        response = client_for(artist).post("/api/v1/music/songs/", payload, format="multipart")
        assert response.status_code == 201
        assert response.data["cover_image"] is not None

    @pytest.mark.parametrize("endpoint", ("/api/v1/music/albums/", "/api/v1/music/songs/"))
    def test_unverified_artist_cannot_publish_music(self, endpoint):
        artist = create_artist()
        artist.artist_verified = False
        artist.save(update_fields=("artist_verified",))
        payload = (
            {"title": "Album", "cover_color": "#123456", "release_date": "2026-08-15"}
            if endpoint.endswith("albums/")
            else {"title": "Song", "duration_sec": 180, "cover_color": "#123456"}
        )
        assert client_for(artist).post(endpoint, payload, format="json").status_code == 403


# ── Stream Tracking ─────────────────────────────────────────────────────


class TestStreamCreate:
    def test_record_stream(self):
        user = create_user()
        song = SongFactory()
        response = client_for(user).post(
            "/api/v1/music/streams/",
            {"song_id": str(song.pk)},
            format="json",
        )
        assert response.status_code == 201
        assert Stream.objects.filter(user=user, song=song).exists()

    def test_stream_increments_play_count(self):
        user = create_user()
        song = SongFactory(play_count=0)
        client_for(user).post(
            "/api/v1/music/streams/",
            {"song_id": str(song.pk)},
            format="json",
        )
        song.refresh_from_db()
        assert song.play_count == 1

    def test_multiple_streams_increment_count(self):
        user = create_user()
        song = SongFactory(play_count=0)
        client = client_for(user)
        for _ in range(5):
            client.post(
                "/api/v1/music/streams/",
                {"song_id": str(song.pk)},
                format="json",
            )
        song.refresh_from_db()
        assert song.play_count == 5

    def test_multiple_users_create_streams(self):
        u1 = create_user(email="u1@example.com", username="u1")
        u2 = create_user(email="u2@example.com", username="u2")
        song = SongFactory()
        client_for(u1).post("/api/v1/music/streams/", {"song_id": str(song.pk)}, format="json")
        client_for(u2).post("/api/v1/music/streams/", {"song_id": str(song.pk)}, format="json")
        assert Stream.objects.filter(song=song).count() == 2
        assert Stream.objects.filter(song=song).values("user").distinct().count() == 2

    def test_stream_requires_auth(self):
        song = SongFactory()
        response = APIClient().post(
            "/api/v1/music/streams/",
            {"song_id": str(song.pk)},
            format="json",
        )
        assert response.status_code == 401

    def test_stream_nonexistent_song_returns_404(self):
        import uuid

        user = create_user()
        response = client_for(user).post(
            "/api/v1/music/streams/",
            {"song_id": str(uuid.uuid4())},
            format="json",
        )
        assert response.status_code == 404

    def test_artist_profile_sums_song_play_counts(self):
        artist = create_artist(username="streaming_artist")
        SongFactory(artist=artist, play_count=7)
        SongFactory(artist=artist, play_count=11)
        response = APIClient().get(f"/api/v1/music/artists/{artist.username}/")
        assert response.status_code == 200
        assert response.data["total_streams"] == 18


# ── Download Permission ─────────────────────────────────────────────────


class TestSongDownload:
    def test_silver_user_can_download(self):
        user = create_user()
        assign_plan(user, SubscriptionPlan.Code.SILVER)
        artist = create_artist()
        song = SongFactory(artist=artist)
        song.audio_file = fake_audio("track.mp3")
        song.save(update_fields=["audio_file"])

        response = client_for(user).get(f"/api/v1/music/songs/{song.pk}/download/")
        assert response.status_code == 200
        assert response["Content-Disposition"].endswith('.mp3"')

    def test_gold_user_can_download(self):
        user = create_user()
        assign_plan(user, SubscriptionPlan.Code.GOLD)
        artist = create_artist()
        song = SongFactory(artist=artist)
        song.audio_file = fake_audio("track.mp3")
        song.save(update_fields=["audio_file"])

        response = client_for(user).get(f"/api/v1/music/songs/{song.pk}/download/")
        assert response.status_code == 200

    def test_free_user_cannot_download(self):
        user = create_user()
        artist = create_artist()
        song = SongFactory(artist=artist)
        song.audio_file = fake_audio("track.mp3")
        song.save(update_fields=["audio_file"])

        response = client_for(user).get(f"/api/v1/music/songs/{song.pk}/download/")
        assert response.status_code == 403

    def test_download_requires_auth(self):
        song = SongFactory()
        response = APIClient().get(f"/api/v1/music/songs/{song.pk}/download/")
        assert response.status_code == 401

    def test_download_without_audio_returns_404(self):
        user = create_user()
        assign_plan(user, SubscriptionPlan.Code.SILVER)
        song = SongFactory()
        response = client_for(user).get(f"/api/v1/music/songs/{song.pk}/download/")
        assert response.status_code == 404
