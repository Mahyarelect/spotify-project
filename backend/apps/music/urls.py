from django.urls import path

from .views import (
    AlbumDetailView,
    AlbumListCreateView,
    PlaylistDetailView,
    PlaylistListCreateView,
    PlaylistSongAddView,
    PlaylistSongRemoveView,
    RecentlyPlayedCreateView,
    RecentlyPlayedListView,
    SearchView,
    SongAudioUploadView,
    SongDetailView,
    SongDownloadView,
    SongListCreateView,
    StreamCreateView,
    StreamStatusView,
    TopSongsView,
)


urlpatterns = [
    path("music/search/", SearchView.as_view(), name="music-search"),
    path("music/albums/", AlbumListCreateView.as_view(), name="album-list-create"),
    path("music/albums/<uuid:pk>/", AlbumDetailView.as_view(), name="album-detail"),
    path("music/songs/", SongListCreateView.as_view(), name="song-list-create"),
    path("music/songs/top/", TopSongsView.as_view(), name="song-top"),
    path("music/songs/<uuid:pk>/", SongDetailView.as_view(), name="song-detail"),
    path("music/songs/<uuid:pk>/upload-audio/", SongAudioUploadView.as_view(), name="song-upload-audio"),
    path("music/songs/<uuid:pk>/download/", SongDownloadView.as_view(), name="song-download"),
    path("music/streams/", StreamCreateView.as_view(), name="stream-create"),
    path("music/streams/status/", StreamStatusView.as_view(), name="stream-status"),
    path("music/recently-played/", RecentlyPlayedListView.as_view(), name="recently-played-list"),
    path("music/recently-played/record/", RecentlyPlayedCreateView.as_view(), name="recently-played-create"),
    path("music/playlists/", PlaylistListCreateView.as_view(), name="playlist-list-create"),
    path("music/playlists/<uuid:pk>/", PlaylistDetailView.as_view(), name="playlist-detail"),
    path("music/playlists/<uuid:pk>/songs/", PlaylistSongAddView.as_view(), name="playlist-song-add"),
    path("music/playlists/<uuid:pk>/songs/remove/", PlaylistSongRemoveView.as_view(), name="playlist-song-remove"),
]
