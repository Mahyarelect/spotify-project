import uuid

from django.conf import settings
from django.db import models


def album_cover_upload_path(instance, filename: str) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    return f"albums/{instance.pk}/{uuid.uuid4().hex}.{extension}"


def song_cover_upload_path(instance, filename: str) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    return f"songs/{instance.pk}/cover/{uuid.uuid4().hex}.{extension}"


def song_audio_upload_path(instance, filename: str) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp3"
    return f"songs/{instance.pk}/audio/{uuid.uuid4().hex}.{extension}"


class Album(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="albums",
    )
    cover_color = models.CharField(max_length=7)
    cover_image = models.ImageField(upload_to=album_cover_upload_path, null=True, blank=True)
    release_date = models.DateField()
    is_early_access = models.BooleanField(default=False)
    genre = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-release_date",)
        constraints = [
            models.UniqueConstraint(fields=("artist", "title"), name="music_album_artist_title_unique"),
        ]

    def __str__(self) -> str:
        return f"{self.title} — {self.artist}"


class Song(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="songs",
    )
    album = models.ForeignKey(
        Album,
        on_delete=models.CASCADE,
        related_name="songs",
        null=True,
        blank=True,
    )
    duration_sec = models.PositiveIntegerField()
    cover_color = models.CharField(max_length=7)
    cover_image = models.ImageField(upload_to=song_cover_upload_path, null=True, blank=True)
    audio_file = models.FileField(upload_to=song_audio_upload_path, null=True, blank=True)
    play_count = models.PositiveIntegerField(default=0)
    lyrics = models.TextField(blank=True)
    genre = models.CharField(max_length=100, blank=True)
    release_year = models.PositiveIntegerField(null=True, blank=True)
    track_number = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.title} — {self.artist}"


class Playlist(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    cover_color = models.CharField(max_length=7)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="playlists",
    )
    description = models.TextField(blank=True)
    songs = models.ManyToManyField(Song, through="PlaylistSong", related_name="playlists", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.title


class PlaylistSong(models.Model):
    id = models.BigAutoField(primary_key=True)
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="playlist_songs")
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="song_playlists")
    position = models.PositiveIntegerField()
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("position",)
        constraints = [
            models.UniqueConstraint(fields=("playlist", "song"), name="music_playlistsong_playlist_song_unique"),
            models.UniqueConstraint(fields=("playlist", "position"), name="music_playlistsong_playlist_position_unique"),
        ]

    def __str__(self) -> str:
        return f"{self.playlist.title} — {self.song.title} (#{self.position})"


class Stream(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="streams",
    )
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="streams")
    streamed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-streamed_at",)
        indexes = [
            models.Index(fields=["song", "streamed_at"], name="music_stream_song_time_idx"),
            models.Index(fields=["user", "song"], name="music_stream_user_song_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user} streamed {self.song}"


class RecentlyPlayed(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recently_played",
    )
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="recently_played_by")
    played_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-played_at",)
        indexes = [
            models.Index(fields=["user", "played_at"], name="music_recent_user_time_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user} played {self.song}"
