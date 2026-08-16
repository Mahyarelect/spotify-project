from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Q
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.common.permissions import IsVerifiedArtist
from apps.subscriptions.permissions import HasPlanFeature
from apps.subscriptions.selectors import get_effective_entitlements
from apps.subscriptions.services import get_daily_stream_limit, get_playlist_limit
from apps.common.domain import DomainError

from .models import Album, Playlist, PlaylistSong, RecentlyPlayed, Song, Stream
from .serializers.serializers import (
    AlbumCreateUpdateSerializer,
    AlbumSerializer,
    ArtistStatisticsSerializer,
    PlaylistAddSongSerializer,
    PlaylistCreateUpdateSerializer,
    PlaylistRemoveSongSerializer,
    PlaylistSerializer,
    RecentlyPlayedCreateSerializer,
    RecentlyPlayedSerializer,
    SearchResultSerializer,
    SongCreateUpdateSerializer,
    SongSerializer,
    SongStatisticsSerializer,
    StreamCreateSerializer,
    StreamSerializer,
    StreamStatusSerializer,
    TopSongSerializer,
)


def _can_view_early_access(request):
    user = request.user
    if not user.is_authenticated:
        return False
    if user.role == User.Role.ADMIN:
        return True
    return get_effective_entitlements(user).early_access_allowed


def _visible_albums(request):
    queryset = Album.objects.all()
    if _can_view_early_access(request):
        return queryset
    if request.user.is_authenticated and request.user.role == User.Role.ARTIST:
        return queryset.filter(Q(is_early_access=False) | Q(artist=request.user))
    return queryset.filter(is_early_access=False)


def _visible_songs(request):
    queryset = Song.objects.all()
    if _can_view_early_access(request):
        return queryset
    visible = Q(album__isnull=True) | Q(album__is_early_access=False)
    if request.user.is_authenticated and request.user.role == User.Role.ARTIST:
        visible |= Q(artist=request.user)
    return queryset.filter(visible)


def _song_statistics(song):
    streams = Stream.objects.filter(song=song)
    total = streams.count()
    rate = Decimal(str(getattr(settings, "ARTIST_RATE_PER_STREAM", "0.003")))
    return {
        "song_id": song.id,
        "total_streams": total,
        "unique_listeners": streams.values("user_id").distinct().count(),
        "revenue": (Decimal(total) * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
    }


def _notify_new_release(song):
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification

    for follower in song.artist.followers.filter(is_active=True, preferences__notify_new_releases=True):
        if song.album and song.album.is_early_access and not get_effective_entitlements(follower).early_access_allowed:
            continue
        create_notification(
            user=follower,
            type=Notification.Type.NEW_RELEASE,
            title="New release",
            message=f"{song.artist.display_name} released {song.title}.",
            link=f"/player/{song.id}",
        )


class AlbumListCreateView(ListCreateAPIView):
    serializer_class = AlbumSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsVerifiedArtist()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AlbumCreateUpdateSerializer
        return AlbumSerializer

    def get_queryset(self):
        return _visible_albums(self.request).select_related("artist").annotate(song_count=Count("songs"))

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(artist=request.user)
        return Response(AlbumSerializer(instance).data, status=status.HTTP_201_CREATED)


class AlbumDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = AlbumSerializer
    permission_classes = (AllowAny,)
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsVerifiedArtist()]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AlbumCreateUpdateSerializer
        return AlbumSerializer

    def get_queryset(self):
        return _visible_albums(self.request).select_related("artist").annotate(song_count=Count("songs"))

    def perform_update(self, serializer):
        if serializer.instance.artist != self.request.user:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You can only edit your own albums.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.artist != self.request.user:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You can only delete your own albums.")
        instance.delete()


class SongListCreateView(ListCreateAPIView):
    serializer_class = SongSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsVerifiedArtist()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SongCreateUpdateSerializer
        return SongSerializer

    def get_queryset(self):
        return _visible_songs(self.request).select_related("artist", "album")

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(artist=request.user)
        transaction.on_commit(lambda: _notify_new_release(instance))
        return Response(SongSerializer(instance).data, status=status.HTTP_201_CREATED)


class SongDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = SongSerializer
    permission_classes = (AllowAny,)
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsVerifiedArtist()]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return SongCreateUpdateSerializer
        return SongSerializer

    def get_queryset(self):
        return _visible_songs(self.request).select_related("artist", "album")

    def perform_update(self, serializer):
        if serializer.instance.artist != self.request.user:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You can only edit your own songs.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.artist != self.request.user:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You can only delete your own songs.")
        instance.delete()


class PlaylistListCreateView(ListCreateAPIView):
    serializer_class = PlaylistSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PlaylistCreateUpdateSerializer
        return PlaylistSerializer

    def get_queryset(self):
        return Playlist.objects.select_related("created_by").annotate(song_count=Count("songs"))

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            User.objects.select_for_update().get(pk=request.user.pk)
            limit = get_playlist_limit(request.user)
            if limit is not None and Playlist.objects.filter(created_by=request.user).count() >= limit:
                raise DomainError(
                    "playlist_limit_reached",
                    f"Your current subscription allows at most {limit} playlists.",
                    status_code=403,
                )
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save(created_by=request.user)
        return Response(PlaylistSerializer(instance, context={"request": request}).data, status=status.HTTP_201_CREATED)


class UserPlaylistListView(ListAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return (
            Playlist.objects.filter(created_by=self.request.user)
            .select_related("created_by")
            .prefetch_related("playlist_songs__song")
            .annotate(song_count=Count("songs"))
        )


class PlaylistDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = (AllowAny,)
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return PlaylistCreateUpdateSerializer
        return PlaylistSerializer

    def get_queryset(self):
        return Playlist.objects.select_related("created_by").prefetch_related(
            "playlist_songs__song__artist",
        ).annotate(song_count=Count("songs"))

    def perform_update(self, serializer):
        if serializer.instance.created_by != self.request.user:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You can only edit your own playlists.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You can only delete your own playlists.")
        instance.delete()


class PlaylistSongAddView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PlaylistAddSongSerializer

    def post(self, request, pk):
        playlist = get_object_or_404(Playlist, pk=pk, created_by=request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        song_id = serializer.validated_data["song_id"]
        song = get_object_or_404(_visible_songs(request), pk=song_id)

        if PlaylistSong.objects.filter(playlist=playlist, song=song).exists():
            return Response(
                {"detail": "Song already in playlist."},
                status=status.HTTP_409_CONFLICT,
            )

        position = serializer.validated_data.get("position")
        if position is None:
            last = PlaylistSong.objects.filter(playlist=playlist).order_by("-position").first()
            position = (last.position + 1) if last else 1

        PlaylistSong.objects.create(playlist=playlist, song=song, position=position)
        return Response(status=status.HTTP_201_CREATED)


class PlaylistSongRemoveView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PlaylistRemoveSongSerializer

    def delete(self, request, pk):
        playlist = get_object_or_404(Playlist, pk=pk, created_by=request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        song_id = serializer.validated_data["song_id"]
        deleted, _ = PlaylistSong.objects.filter(playlist=playlist, song_id=song_id).delete()

        if deleted == 0:
            raise Http404("Song not found in playlist.")

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongAudioUploadView(GenericAPIView):
    permission_classes = (IsVerifiedArtist,)
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = SongCreateUpdateSerializer

    def put(self, request, pk):
        song = get_object_or_404(Song, pk=pk, artist=request.user)
        audio = request.FILES.get("audio_file")
        if not audio:
            return Response(
                {"audio_file": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        extension = audio.name.rsplit(".", 1)[-1].lower() if "." in audio.name else ""
        allowed_types = {
            "mp3": {"audio/mpeg", "audio/mp3"},
            "wav": {"audio/wav", "audio/x-wav", "audio/wave"},
            "flac": {"audio/flac", "audio/x-flac"},
        }
        content_type = (getattr(audio, "content_type", "") or "").lower()
        if extension not in allowed_types or content_type not in allowed_types[extension]:
            return Response(
                {"audio_file": ["Only MP3, WAV, and FLAC audio files are supported."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        max_size = 50 * 1024 * 1024
        if audio.size > max_size:
            return Response(
                {"audio_file": ["Audio files must not exceed 50 MB."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        song.audio_file = audio
        song.save(update_fields=["audio_file", "updated_at"])
        return Response(SongSerializer(song).data)


class StreamCreateView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = StreamCreateSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        song_id = serializer.validated_data["song_id"]
        song = get_object_or_404(_visible_songs(request), pk=song_id)

        with transaction.atomic():
            User.objects.select_for_update().get(pk=request.user.pk)
            daily_limit = get_daily_stream_limit(request.user)
            if daily_limit is not None:
                today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
                used = Stream.objects.filter(user=request.user, streamed_at__gte=today_start).count()
                if used >= daily_limit:
                    raise DomainError(
                        "daily_stream_limit_reached",
                        "Your daily streaming limit has been reached.",
                        status_code=403,
                    )
            stream = Stream.objects.create(user=request.user, song=song)
            Song.objects.filter(pk=song_id).update(play_count=F("play_count") + 1)

        return Response(StreamSerializer(stream).data, status=status.HTTP_201_CREATED)


class SongDownloadView(GenericAPIView):
    permission_classes = (IsAuthenticated, HasPlanFeature)
    required_plan_feature = "download_allowed"

    def get(self, request, pk):
        song = get_object_or_404(_visible_songs(request), pk=pk)
        if not song.audio_file:
            raise Http404("No audio file available for this song.")
        return FileResponse(
            song.audio_file.open("rb"),
            as_attachment=True,
            filename=f"{song.title}.mp3",
            content_type="audio/mpeg",
        )


class SearchView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = SearchResultSerializer

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not q:
            return Response(
                {"detail": "Query parameter 'q' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        songs = _visible_songs(request).filter(
            Q(title__icontains=q) | Q(artist__display_name__icontains=q) | Q(genre__icontains=q)
        ).select_related("artist", "album")[:20]

        albums = _visible_albums(request).filter(
            Q(title__icontains=q) | Q(artist__display_name__icontains=q) | Q(genre__icontains=q)
        ).select_related("artist").annotate(song_count=Count("songs"))[:20]

        playlists = Playlist.objects.filter(
            Q(title__icontains=q) | Q(description__icontains=q)
        ).select_related("created_by").annotate(song_count=Count("songs"))[:20]

        return Response(
            {
                "songs": SongSerializer(songs, many=True, context={"request": request}).data,
                "albums": AlbumSerializer(albums, many=True, context={"request": request}).data,
                "playlists": PlaylistSerializer(playlists, many=True, context={"request": request}).data,
            }
        )


class RecentlyPlayedListView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = RecentlyPlayedSerializer

    def get_queryset(self):
        return RecentlyPlayed.objects.filter(user=self.request.user).select_related(
            "song__artist", "song"
        )[:50]


class RecentlyPlayedCreateView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = RecentlyPlayedCreateSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        song_id = serializer.validated_data["song_id"]
        song = get_object_or_404(_visible_songs(request), pk=song_id)

        RecentlyPlayed.objects.create(user=request.user, song=song)
        return Response(status=status.HTTP_201_CREATED)


class TopSongsView(ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = SongSerializer

    def get_queryset(self):
        limit = int(self.request.query_params.get("limit", 50))
        limit = min(limit, 100)
        return (
            _visible_songs(self.request).select_related("artist", "album")
            .filter(play_count__gt=0)
            .order_by("-play_count")[:limit]
        )


class StreamStatusView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = StreamStatusSerializer

    def get(self, request):
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        streams_today = Stream.objects.filter(user=request.user, streamed_at__gte=today_start).count()

        entitlement = get_effective_entitlements(request.user)
        daily_limit = entitlement.daily_stream_limit

        can_stream = daily_limit is None or streams_today < daily_limit

        return Response(
            {
                "streams_today": streams_today,
                "daily_limit": daily_limit,
                "can_stream": can_stream,
            }
        )


class SongStatisticsView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SongStatisticsSerializer

    def get(self, request, pk):
        song = get_object_or_404(Song.objects.select_related("artist", "album"), pk=pk)
        if not (
            request.user == song.artist
            or request.user.role == User.Role.ADMIN
            or get_effective_entitlements(request.user).statistics_allowed
        ):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Gold subscription is required to view song statistics.")
        return Response(self.get_serializer(_song_statistics(song)).data)


class ArtistStatisticsView(GenericAPIView):
    permission_classes = (IsVerifiedArtist,)
    serializer_class = ArtistStatisticsSerializer

    def get(self, request):
        songs = list(Song.objects.filter(artist=request.user))
        rows = [_song_statistics(song) for song in songs]
        data = {
            "total_streams": sum(row["total_streams"] for row in rows),
            "unique_listeners": Stream.objects.filter(song__artist=request.user).values("user_id").distinct().count(),
            "revenue": sum((row["revenue"] for row in rows), Decimal("0")),
            "song_count": len(songs),
            "songs": rows,
        }
        return Response(self.get_serializer(data).data)


class ArtistProfileView(GenericAPIView):
    permission_classes = (AllowAny,)

    def get(self, request, username):
        artist = get_object_or_404(
            User.objects.filter(role=User.Role.ARTIST, is_active=True),
            username=username,
        )

        songs = _visible_songs(request).filter(artist=artist).select_related("album")
        albums = (
            _visible_albums(request).filter(artist=artist)
            .annotate(song_count=Count("songs"))
            .filter(song_count__gt=1)
            .select_related("artist")
        )
        singles = (
            _visible_albums(request).filter(artist=artist)
            .annotate(song_count=Count("songs"))
            .filter(song_count=1)
            .select_related("artist")
        )
        can_view_statistics = (
            request.user.is_authenticated
            and (
                request.user == artist
                or request.user.role == User.Role.ADMIN
                or get_effective_entitlements(request.user).statistics_allowed
            )
        )
        total_streams = Stream.objects.filter(song__artist=artist).count()

        return Response(
            {
                "id": str(artist.pk),
                "username": artist.username,
                "display_name": artist.display_name,
                "avatar_url": artist.avatar.url if artist.avatar else None,
                "bio": artist.bio,
                "role": artist.role,
                "artist_verified": artist.artist_verified,
                "followers_count": artist.followers.count(),
                "is_following": (
                    request.user.is_authenticated
                    and artist.followers.filter(pk=request.user.pk).exists()
                ),
                "songs": SongSerializer(songs, many=True).data,
                "albums": AlbumSerializer(albums, many=True).data,
                "singles": AlbumSerializer(singles, many=True).data,
                "total_streams": total_streams if can_view_statistics else None,
            }
        )
