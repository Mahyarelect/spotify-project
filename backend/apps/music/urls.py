from django.urls import path

from .views import (
    AlbumDetailView,
    AlbumListCreateView,
    PlaylistDetailView,
    PlaylistListCreateView,
    PlaylistSongAddView,
    PlaylistSongRemoveView,
    SongAudioUploadView,
    SongDetailView,
    SongDownloadView,
    SongListCreateView,
    StreamCreateView,
)


urlpatterns = [
    path("music/albums/", AlbumListCreateView.as_view(), name="album-list-create"),
    path("music/albums/<uuid:pk>/", AlbumDetailView.as_view(), name="album-detail"),
    path("music/songs/", SongListCreateView.as_view(), name="song-list-create"),
    path("music/songs/<uuid:pk>/", SongDetailView.as_view(), name="song-detail"),
    path("music/songs/<uuid:pk>/upload-audio/", SongAudioUploadView.as_view(), name="song-upload-audio"),
    path("music/songs/<uuid:pk>/download/", SongDownloadView.as_view(), name="song-download"),
    path("music/streams/", StreamCreateView.as_view(), name="stream-create"),
    path("music/playlists/", PlaylistListCreateView.as_view(), name="playlist-list-create"),
    path("music/playlists/<uuid:pk>/", PlaylistDetailView.as_view(), name="playlist-detail"),
    path("music/playlists/<uuid:pk>/songs/", PlaylistSongAddView.as_view(), name="playlist-song-add"),
    path("music/playlists/<uuid:pk>/songs/remove/", PlaylistSongRemoveView.as_view(), name="playlist-song-remove"),
]
