from datetime import date

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.music.models import Album, Playlist, PlaylistSong, Song

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


# ── Album CRUD ──────────────────────────────────────────────────────────


class TestAlbumList:
    def test_list_albums(self):
        AlbumFactory.create_batch(3)
        response = APIClient().get("/api/v1/music/albums/")
        assert response.status_code == 200
        assert len(response.data) == 3

    def test_list_albums_includes_song_count(self):
        album = AlbumFactory()
        SongFactory(album=album)
        SongFactory(album=album)
        response = APIClient().get("/api/v1/music/albums/")
        assert response.data[0]["song_count"] == 2


class TestAlbumCreate:
    def test_create_album(self):
        artist = create_artist()
        payload = {
            "title": "New Album",
            "cover_color": "#FF0000",
            "release_date": "2024-01-15",
            "is_early_access": False,
            "genre": "Pop",
        }
        response = client_for(artist).post("/api/v1/music/albums/", payload, format="json")
        assert response.status_code == 201
        assert response.data["title"] == "New Album"
        assert response.data["artist"] == artist.pk

    def test_create_album_requires_auth(self):
        response = APIClient().post("/api/v1/music/albums/", {"title": "X"}, format="json")
        assert response.status_code == 401


class TestAlbumDetail:
    def test_get_album(self):
        album = AlbumFactory(title="Test Album")
        response = APIClient().get(f"/api/v1/music/albums/{album.pk}/")
        assert response.status_code == 200
        assert response.data["title"] == "Test Album"

    def test_update_album_as_owner(self):
        artist = create_artist()
        album = AlbumFactory(artist=artist, title="Old Title")
        response = client_for(artist).patch(
            f"/api/v1/music/albums/{album.pk}/",
            {"title": "New Title"},
            format="json",
        )
        assert response.status_code == 200
        album.refresh_from_db()
        assert album.title == "New Title"

    def test_update_album_as_non_owner_forbidden(self):
        album = AlbumFactory(title="Owned")
        other = create_user()
        response = client_for(other).patch(
            f"/api/v1/music/albums/{album.pk}/",
            {"title": "Hacked"},
            format="json",
        )
        assert response.status_code == 403

    def test_delete_album_as_owner(self):
        artist = create_artist()
        album = AlbumFactory(artist=artist)
        response = client_for(artist).delete(f"/api/v1/music/albums/{album.pk}/")
        assert response.status_code == 204
        assert not Album.objects.filter(pk=album.pk).exists()

    def test_delete_album_as_non_owner_forbidden(self):
        album = AlbumFactory()
        other = create_user()
        response = client_for(other).delete(f"/api/v1/music/albums/{album.pk}/")
        assert response.status_code == 403

    def test_album_not_found(self):
        import uuid

        response = APIClient().get(f"/api/v1/music/albums/{uuid.uuid4()}/")
        assert response.status_code == 404


# ── Song CRUD ──────────────────────────────────────────────────────────


class TestSongList:
    def test_list_songs(self):
        SongFactory.create_batch(3)
        response = APIClient().get("/api/v1/music/songs/")
        assert response.status_code == 200
        assert len(response.data) == 3

    def test_list_songs_includes_artist_and_album(self):
        song = SongFactory(title="My Song")
        response = APIClient().get("/api/v1/music/songs/")
        result = response.data[0]
        assert result["title"] == "My Song"
        assert result["artist_name"] is not None
        assert result["album_title"] is not None


class TestSongCreate:
    def test_create_song(self):
        artist = create_artist()
        album = AlbumFactory(artist=artist)
        payload = {
            "title": "New Song",
            "album": str(album.pk),
            "duration_sec": 210,
            "cover_color": "#00FF00",
            "genre": "Rock",
        }
        response = client_for(artist).post("/api/v1/music/songs/", payload, format="json")
        assert response.status_code == 201
        assert response.data["title"] == "New Song"
        assert response.data["artist"] == artist.pk

    def test_create_song_without_album(self):
        artist = create_artist()
        payload = {
            "title": "Standalone Single",
            "duration_sec": 180,
            "cover_color": "#0000FF",
        }
        response = client_for(artist).post("/api/v1/music/songs/", payload, format="json")
        assert response.status_code == 201
        assert response.data["album"] is None

    def test_create_song_requires_auth(self):
        response = APIClient().post("/api/v1/music/songs/", {"title": "X"}, format="json")
        assert response.status_code == 401


class TestSongDetail:
    def test_get_song(self):
        song = SongFactory(title="Detail Song")
        response = APIClient().get(f"/api/v1/music/songs/{song.pk}/")
        assert response.status_code == 200
        assert response.data["title"] == "Detail Song"

    def test_update_song_as_owner(self):
        artist = create_artist()
        song = SongFactory(artist=artist, title="Old Song")
        response = client_for(artist).patch(
            f"/api/v1/music/songs/{song.pk}/",
            {"title": "New Song"},
            format="json",
        )
        assert response.status_code == 200
        song.refresh_from_db()
        assert song.title == "New Song"

    def test_update_song_as_non_owner_forbidden(self):
        song = SongFactory()
        other = create_user()
        response = client_for(other).patch(
            f"/api/v1/music/songs/{song.pk}/",
            {"title": "Hacked"},
            format="json",
        )
        assert response.status_code == 403

    def test_delete_song_as_owner(self):
        artist = create_artist()
        song = SongFactory(artist=artist)
        response = client_for(artist).delete(f"/api/v1/music/songs/{song.pk}/")
        assert response.status_code == 204
        assert not Song.objects.filter(pk=song.pk).exists()

    def test_delete_song_as_non_owner_forbidden(self):
        song = SongFactory()
        other = create_user()
        response = client_for(other).delete(f"/api/v1/music/songs/{song.pk}/")
        assert response.status_code == 403


# ── Playlist CRUD ──────────────────────────────────────────────────────


class TestPlaylistList:
    def test_list_playlists(self):
        PlaylistFactory.create_batch(3)
        response = APIClient().get("/api/v1/music/playlists/")
        assert response.status_code == 200
        assert len(response.data) == 3

    def test_list_playlists_includes_song_count(self):
        playlist = PlaylistFactory()
        song = SongFactory()
        PlaylistSongFactory(playlist=playlist, song=song, position=1)
        response = APIClient().get("/api/v1/music/playlists/")
        assert response.data[0]["song_count"] == 1


class TestPlaylistCreate:
    def test_create_playlist(self):
        user = create_user()
        payload = {
            "title": "My Playlist",
            "cover_color": "#ABCDEF",
            "description": "Great songs",
        }
        response = client_for(user).post("/api/v1/music/playlists/", payload, format="json")
        assert response.status_code == 201
        assert response.data["title"] == "My Playlist"
        assert response.data["created_by"] == user.pk

    def test_create_playlist_requires_auth(self):
        response = APIClient().post("/api/v1/music/playlists/", {"title": "X"}, format="json")
        assert response.status_code == 401


class TestPlaylistDetail:
    def test_get_playlist_with_songs(self):
        playlist = PlaylistFactory(title="My Playlist")
        song = SongFactory(title="Track 1")
        PlaylistSongFactory(playlist=playlist, song=song, position=1)
        response = APIClient().get(f"/api/v1/music/playlists/{playlist.pk}/")
        assert response.status_code == 200
        assert response.data["title"] == "My Playlist"
        assert len(response.data["songs"]) == 1
        assert response.data["songs"][0]["song_title"] == "Track 1"

    def test_update_playlist_as_owner(self):
        user = create_user()
        playlist = PlaylistFactory(created_by=user, title="Old Title")
        response = client_for(user).patch(
            f"/api/v1/music/playlists/{playlist.pk}/",
            {"title": "New Title"},
            format="json",
        )
        assert response.status_code == 200
        playlist.refresh_from_db()
        assert playlist.title == "New Title"

    def test_update_playlist_as_non_owner_forbidden(self):
        playlist = PlaylistFactory()
        other = create_user()
        response = client_for(other).patch(
            f"/api/v1/music/playlists/{playlist.pk}/",
            {"title": "Hacked"},
            format="json",
        )
        assert response.status_code == 403

    def test_delete_playlist_as_owner(self):
        user = create_user()
        playlist = PlaylistFactory(created_by=user)
        response = client_for(user).delete(f"/api/v1/music/playlists/{playlist.pk}/")
        assert response.status_code == 204
        assert not Playlist.objects.filter(pk=playlist.pk).exists()

    def test_delete_playlist_as_non_owner_forbidden(self):
        playlist = PlaylistFactory()
        other = create_user()
        response = client_for(other).delete(f"/api/v1/music/playlists/{playlist.pk}/")
        assert response.status_code == 403


# ── Playlist Add/Remove Song ───────────────────────────────────────────


class TestPlaylistAddSong:
    def test_add_song_to_playlist(self):
        user = create_user()
        playlist = PlaylistFactory(created_by=user)
        song = SongFactory()
        payload = {"song_id": str(song.pk)}
        response = client_for(user).post(
            f"/api/v1/music/playlists/{playlist.pk}/songs/", payload, format="json"
        )
        assert response.status_code == 201
        assert PlaylistSong.objects.filter(playlist=playlist, song=song).exists()

    def test_add_song_with_position(self):
        user = create_user()
        playlist = PlaylistFactory(created_by=user)
        s1 = SongFactory()
        s2 = SongFactory()
        client = client_for(user)
        url = f"/api/v1/music/playlists/{playlist.pk}/songs/"

        client.post(url, {"song_id": str(s1.pk), "position": 2}, format="json")
        client.post(url, {"song_id": str(s2.pk), "position": 1}, format="json")

        positions = list(
            PlaylistSong.objects.filter(playlist=playlist)
            .order_by("position")
            .values_list("position", flat=True)
        )
        assert positions == [1, 2]

    def test_add_song_auto_position(self):
        user = create_user()
        playlist = PlaylistFactory(created_by=user)
        s1 = SongFactory()
        s2 = SongFactory()
        client = client_for(user)
        url = f"/api/v1/music/playlists/{playlist.pk}/songs/"

        client.post(url, {"song_id": str(s1.pk)}, format="json")
        client.post(url, {"song_id": str(s2.pk)}, format="json")

        ps = PlaylistSong.objects.filter(playlist=playlist).order_by("position")
        assert ps[0].position == 1
        assert ps[1].position == 2

    def test_add_duplicate_song_returns_409(self):
        user = create_user()
        playlist = PlaylistFactory(created_by=user)
        song = SongFactory()
        PlaylistSongFactory(playlist=playlist, song=song, position=1)

        response = client_for(user).post(
            f"/api/v1/music/playlists/{playlist.pk}/songs/",
            {"song_id": str(song.pk)},
            format="json",
        )
        assert response.status_code == 409

    def test_add_song_requires_playlist_owner(self):
        playlist = PlaylistFactory()
        song = SongFactory()
        other = create_user()
        response = client_for(other).post(
            f"/api/v1/music/playlists/{playlist.pk}/songs/",
            {"song_id": str(song.pk)},
            format="json",
        )
        assert response.status_code == 404

    def test_add_nonexistent_song_returns_404(self):
        import uuid

        user = create_user()
        playlist = PlaylistFactory(created_by=user)
        response = client_for(user).post(
            f"/api/v1/music/playlists/{playlist.pk}/songs/",
            {"song_id": str(uuid.uuid4())},
            format="json",
        )
        assert response.status_code == 404


class TestPlaylistRemoveSong:
    def test_remove_song_from_playlist(self):
        user = create_user()
        playlist = PlaylistFactory(created_by=user)
        song = SongFactory()
        PlaylistSongFactory(playlist=playlist, song=song, position=1)

        response = client_for(user).delete(
            f"/api/v1/music/playlists/{playlist.pk}/songs/remove/",
            {"song_id": str(song.pk)},
            format="json",
        )
        assert response.status_code == 204
        assert not PlaylistSong.objects.filter(playlist=playlist, song=song).exists()

    def test_remove_nonexistent_song_returns_404(self):
        import uuid

        user = create_user()
        playlist = PlaylistFactory(created_by=user)
        response = client_for(user).delete(
            f"/api/v1/music/playlists/{playlist.pk}/songs/remove/",
            {"song_id": str(uuid.uuid4())},
            format="json",
        )
        assert response.status_code == 404

    def test_remove_song_requires_playlist_owner(self):
        playlist = PlaylistFactory()
        song = SongFactory()
        other = create_user()
        response = client_for(other).delete(
            f"/api/v1/music/playlists/{playlist.pk}/songs/remove/",
            {"song_id": str(song.pk)},
            format="json",
        )
        assert response.status_code == 404
