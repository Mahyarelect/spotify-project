from django.contrib import admin

from .models import Album, Playlist, PlaylistSong, Song


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "release_date", "is_early_access", "genre", "created_at")
    list_filter = ("is_early_access", "release_date")
    search_fields = ("title", "artist__email", "artist__username", "genre")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "album", "duration_sec", "play_count", "genre", "created_at")
    list_filter = ("genre", "release_year")
    search_fields = ("title", "artist__email", "artist__username", "genre")
    readonly_fields = ("play_count", "created_at", "updated_at")


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ("title", "created_by", "created_at")
    search_fields = ("title", "created_by__email", "created_by__username")
    readonly_fields = ("created_at", "updated_at")


@admin.register(PlaylistSong)
class PlaylistSongAdmin(admin.ModelAdmin):
    list_display = ("playlist", "song", "position", "added_at")
    search_fields = ("playlist__title", "song__title")
    readonly_fields = ("added_at",)
