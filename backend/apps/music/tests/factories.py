import factory
from factory.django import DjangoModelFactory

from apps.accounts.tests.factories import UserFactory
from apps.music.models import Album, Playlist, PlaylistSong, Song


class AlbumFactory(DjangoModelFactory):
    class Meta:
        model = Album

    title = factory.Sequence(lambda n: f"Album {n}")
    artist = factory.SubFactory(UserFactory, role="artist", username=factory.Sequence(lambda n: f"album_artist{n}"))
    cover_color = "#1DB954"
    release_date = factory.Faker("date_object")
    is_early_access = False
    genre = factory.Faker("word")


class SongFactory(DjangoModelFactory):
    class Meta:
        model = Song

    title = factory.Sequence(lambda n: f"Song {n}")
    artist = factory.SubFactory(UserFactory, role="artist", username=factory.Sequence(lambda n: f"song_artist{n}"))
    album = factory.SubFactory(AlbumFactory)
    duration_sec = factory.Faker("random_int", min=120, max=360)
    cover_color = "#1DB954"
    play_count = 0
    genre = factory.Faker("word")


class PlaylistFactory(DjangoModelFactory):
    class Meta:
        model = Playlist

    title = factory.Sequence(lambda n: f"Playlist {n}")
    cover_color = "#1DB954"
    created_by = factory.SubFactory(UserFactory, username=factory.Sequence(lambda n: f"playlist_user{n}"))
    description = factory.Faker("sentence")


class PlaylistSongFactory(DjangoModelFactory):
    class Meta:
        model = PlaylistSong

    playlist = factory.SubFactory(PlaylistFactory)
    song = factory.SubFactory(SongFactory)
    position = factory.Sequence(lambda n: n)
