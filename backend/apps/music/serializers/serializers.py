from rest_framework import serializers

from apps.accounts.serializers.profile import RejectUnknownFieldsMixin

from ..models import Album, Playlist, PlaylistSong, RecentlyPlayed, Song, Stream


class AlbumSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.display_name", read_only=True)
    song_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Album
        fields = (
            "id",
            "title",
            "artist",
            "artist_name",
            "cover_color",
            "cover_image",
            "release_date",
            "is_early_access",
            "genre",
            "song_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "artist", "artist_name", "song_count", "created_at", "updated_at")


class AlbumCreateUpdateSerializer(RejectUnknownFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ("title", "cover_color", "cover_image", "release_date", "is_early_access", "genre")


class SongSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.display_name", read_only=True)
    album_title = serializers.CharField(source="album.title", read_only=True, default=None)
    has_audio = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = (
            "id",
            "title",
            "artist",
            "artist_name",
            "album",
            "album_title",
            "duration_sec",
            "cover_color",
            "cover_image",
            "audio_file",
            "has_audio",
            "play_count",
            "lyrics",
            "genre",
            "release_year",
            "track_number",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "artist",
            "artist_name",
            "audio_file",
            "has_audio",
            "play_count",
            "album_title",
            "created_at",
            "updated_at",
        )

    def get_has_audio(self, obj):
        return bool(obj.audio_file)


class SongCreateUpdateSerializer(RejectUnknownFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = (
            "title",
            "album",
            "duration_sec",
            "cover_color",
            "cover_image",
            "lyrics",
            "genre",
            "release_year",
            "track_number",
        )


class PlaylistSongSerializer(serializers.ModelSerializer):
    song_title = serializers.CharField(source="song.title", read_only=True)
    song_artist = serializers.CharField(source="song.artist.display_name", read_only=True)
    song_duration = serializers.IntegerField(source="song.duration_sec", read_only=True)

    class Meta:
        model = PlaylistSong
        fields = ("song", "song_title", "song_artist", "song_duration", "position", "added_at")
        read_only_fields = ("song_title", "song_artist", "song_duration", "position", "added_at")


class PlaylistSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.display_name", read_only=True)
    song_count = serializers.IntegerField(read_only=True)
    songs = PlaylistSongSerializer(source="playlist_songs", many=True, read_only=True)

    class Meta:
        model = Playlist
        fields = (
            "id",
            "title",
            "cover_color",
            "created_by",
            "created_by_name",
            "description",
            "song_count",
            "songs",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_by_name", "song_count", "songs", "created_at", "updated_at")


class PlaylistCreateUpdateSerializer(RejectUnknownFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ("title", "cover_color", "description")


class PlaylistAddSongSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    song_id = serializers.UUIDField()
    position = serializers.IntegerField(min_value=1, required=False)


class PlaylistRemoveSongSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    song_id = serializers.UUIDField()


class StreamCreateSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    song_id = serializers.UUIDField()


class StreamSerializer(serializers.ModelSerializer):
    song_title = serializers.CharField(source="song.title", read_only=True)

    class Meta:
        model = Stream
        fields = ("id", "song", "song_title", "streamed_at")
        read_only_fields = ("id", "song", "song_title", "streamed_at")


class RecentlyPlayedSerializer(serializers.ModelSerializer):
    song_title = serializers.CharField(source="song.title", read_only=True)
    artist_name = serializers.CharField(source="song.artist.display_name", read_only=True)
    duration_sec = serializers.IntegerField(source="song.duration_sec", read_only=True)
    cover_color = serializers.CharField(source="song.cover_color", read_only=True)
    cover_image = serializers.ImageField(source="song.cover_image", read_only=True)

    class Meta:
        model = RecentlyPlayed
        fields = (
            "id",
            "song",
            "song_title",
            "artist_name",
            "duration_sec",
            "cover_color",
            "cover_image",
            "played_at",
        )
        read_only_fields = fields


class RecentlyPlayedCreateSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    song_id = serializers.UUIDField()


class SearchResultSerializer(serializers.Serializer):
    songs = SongSerializer(many=True)
    albums = AlbumSerializer(many=True)
    playlists = PlaylistSerializer(many=True)


class StreamStatusSerializer(serializers.Serializer):
    streams_today = serializers.IntegerField()
    daily_limit = serializers.IntegerField(allow_null=True)
    can_stream = serializers.BooleanField()


class TopSongSerializer(SongSerializer):
    rank = serializers.IntegerField(read_only=True)
