from datetime import date

import pytest
from django.db import IntegrityError

from apps.accounts.models import User
from apps.music.models import Album, Playlist, PlaylistSong, Song

from .factories import AlbumFactory, PlaylistFactory, PlaylistSongFactory, SongFactory

pytestmark = pytest.mark.django_db


class TestAlbum:
    def test_create_album(self):
        album = AlbumFactory(title="Dark Side", genre="Rock")
        assert album.pk is not None
        assert album.title == "Dark Side"
        assert album.genre == "Rock"
        assert album.is_early_access is False

    def test_str(self):
        album = AlbumFactory(title="My Album")
        assert "My Album" in str(album)

    def test_unique_artist_title_constraint(self):
        artist = User.objects.create_user(
            email="artist@example.com",
            password="Pass123!",
            role=User.Role.ARTIST,
            birth_date=date(1990, 1, 1),
        )
        AlbumFactory(title="Same Title", artist=artist)
        with pytest.raises(IntegrityError):
            AlbumFactory(title="Same Title", artist=artist)

    def test_different_artists_same_title_allowed(self):
        a1 = AlbumFactory(title="Shared Title")
        a2 = AlbumFactory(title="Shared Title")
        assert a1.artist != a2.artist
        assert a1.title == a2.title

    def test_ordering_is_by_release_date_desc(self):
        a1 = AlbumFactory(release_date=date(2020, 1, 1))
        a2 = AlbumFactory(release_date=date(2023, 6, 15))
        a3 = AlbumFactory(release_date=date(2021, 3, 10))
        albums = list(Album.objects.all())
        assert albums == [a2, a3, a1]


class TestSong:
    def test_create_song(self):
        song = SongFactory(title="Bohemian Rhapsody", duration_sec=354, genre="Rock")
        assert song.pk is not None
        assert song.title == "Bohemian Rhapsody"
        assert song.duration_sec == 354
        assert song.play_count == 0

    def test_str(self):
        song = SongFactory(title="My Song")
        assert "My Song" in str(song)

    def test_song_without_album(self):
        song = SongFactory(album=None)
        assert song.album is None

    def test_album_cascade_delete(self):
        album = AlbumFactory()
        song = SongFactory(album=album)
        album_pk = album.pk
        album.delete()
        assert not Song.objects.filter(pk=song.pk).exists()

    def test_play_count_default_zero(self):
        song = SongFactory()
        assert song.play_count == 0


class TestPlaylist:
    def test_create_playlist(self):
        playlist = PlaylistFactory(title="Road Trip", description="Long drive songs")
        assert playlist.pk is not None
        assert playlist.title == "Road Trip"
        assert playlist.description == "Long drive songs"

    def test_str(self):
        playlist = PlaylistFactory(title="My Playlist")
        assert "My Playlist" in str(playlist)

    def test_add_songs_through_model(self):
        playlist = PlaylistFactory()
        s1 = SongFactory()
        s2 = SongFactory()
        PlaylistSongFactory(playlist=playlist, song=s1, position=1)
        PlaylistSongFactory(playlist=playlist, song=s2, position=2)
        assert playlist.songs.count() == 2

    def test_songs_ordered_by_position(self):
        playlist = PlaylistFactory()
        s1 = SongFactory(title="First")
        s2 = SongFactory(title="Second")
        s3 = SongFactory(title="Third")
        PlaylistSongFactory(playlist=playlist, song=s3, position=3)
        PlaylistSongFactory(playlist=playlist, song=s1, position=1)
        PlaylistSongFactory(playlist=playlist, song=s2, position=2)
        titles = [ps.song.title for ps in playlist.playlist_songs.all()]
        assert titles == ["First", "Second", "Third"]

    def test_unique_playlist_song_constraint(self):
        playlist = PlaylistFactory()
        song = SongFactory()
        PlaylistSongFactory(playlist=playlist, song=song, position=1)
        with pytest.raises(IntegrityError):
            PlaylistSongFactory(playlist=playlist, song=song, position=2)

    def test_unique_playlist_position_constraint(self):
        playlist = PlaylistFactory()
        s1 = SongFactory()
        s2 = SongFactory()
        PlaylistSongFactory(playlist=playlist, song=s1, position=1)
        with pytest.raises(IntegrityError):
            PlaylistSongFactory(playlist=playlist, song=s2, position=1)

    def test_playlist_cascade_delete(self):
        playlist = PlaylistFactory()
        song = SongFactory()
        PlaylistSongFactory(playlist=playlist, song=song, position=1)
        playlist.delete()
        assert not PlaylistSong.objects.filter(playlist_id=playlist.pk).exists()
        assert Song.objects.filter(pk=song.pk).exists()

    def test_created_by_cascade_delete(self):
        from apps.accounts.tests.factories import UserFactory

        user = UserFactory()
        playlist = PlaylistFactory(created_by=user)
        user.delete()
        assert not Playlist.objects.filter(pk=playlist.pk).exists()
