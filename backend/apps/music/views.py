from django.db.models import Count, F
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.subscriptions.permissions import HasPlanFeature
from apps.subscriptions.selectors import get_effective_entitlements

from .models import Album, Playlist, PlaylistSong, Song, Stream
from .serializers.serializers import (
    AlbumCreateUpdateSerializer,
    AlbumSerializer,
    PlaylistAddSongSerializer,
    PlaylistCreateUpdateSerializer,
    PlaylistRemoveSongSerializer,
    PlaylistSerializer,
    SongCreateUpdateSerializer,
    SongSerializer,
    StreamCreateSerializer,
    StreamSerializer,
)


class AlbumListCreateView(ListCreateAPIView):
    serializer_class = AlbumSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AlbumCreateUpdateSerializer
        return AlbumSerializer

    def get_queryset(self):
        return Album.objects.select_related("artist").annotate(song_count=Count("songs"))

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

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AlbumCreateUpdateSerializer
        return AlbumSerializer

    def get_queryset(self):
        return Album.objects.select_related("artist").annotate(song_count=Count("songs"))

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
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SongCreateUpdateSerializer
        return SongSerializer

    def get_queryset(self):
        return Song.objects.select_related("artist", "album")

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(artist=request.user)
        return Response(SongSerializer(instance).data, status=status.HTTP_201_CREATED)


class SongDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = SongSerializer
    permission_classes = (AllowAny,)
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return SongCreateUpdateSerializer
        return SongSerializer

    def get_queryset(self):
        return Song.objects.select_related("artist", "album")

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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user)
        return Response(PlaylistSerializer(instance).data, status=status.HTTP_201_CREATED)


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
        song = get_object_or_404(Song, pk=song_id)

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
    permission_classes = (IsAuthenticated,)
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
        song = get_object_or_404(Song, pk=song_id)

        stream = Stream.objects.create(user=request.user, song=song)
        Song.objects.filter(pk=song_id).update(play_count=F("play_count") + 1)

        return Response(StreamSerializer(stream).data, status=status.HTTP_201_CREATED)


class SongDownloadView(GenericAPIView):
    permission_classes = (IsAuthenticated, HasPlanFeature)
    required_plan_feature = "download_allowed"

    def get(self, request, pk):
        song = get_object_or_404(Song, pk=pk)
        if not song.audio_file:
            raise Http404("No audio file available for this song.")
        return FileResponse(
            song.audio_file.open("rb"),
            as_attachment=True,
            filename=f"{song.title}.mp3",
            content_type="audio/mpeg",
        )
