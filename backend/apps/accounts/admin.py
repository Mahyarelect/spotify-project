from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import ArtistApplication, User, UserPreference


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "username", "display_name", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff", "artist_verified")
    search_fields = ("email", "username", "display_name")
    readonly_fields = ("date_joined", "last_login", "updated_at")
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Music app",
            {
                "fields": (
                    "display_name",
                    "role",
                    "birth_date",
                    "gender",
                    "avatar",
                    "bio",
                    "artist_verified",
                    "updated_at",
                )
            },
        ),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Music app", {"fields": ("email", "display_name", "role", "birth_date", "gender")}),
    )


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "language", "sound_enabled", "updated_at")
    search_fields = ("user__email", "user__username")


@admin.register(ArtistApplication)
class ArtistApplicationAdmin(admin.ModelAdmin):
    list_display = ("artist_name", "user", "status", "submitted_at", "reviewed_at")
    list_filter = ("status",)
    search_fields = ("artist_name", "user__email", "user__username")
    readonly_fields = ("submitted_at", "reviewed_at")
