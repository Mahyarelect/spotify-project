import secrets
import uuid

from django.conf import settings
from django.db import models

from apps.music.models import Song


def invite_code() -> str:
    return secrets.token_urlsafe(9)


class ListeningGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invite_code = models.CharField(max_length=16, unique=True, default=invite_code, editable=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listening_groups")
    current_song = models.ForeignKey(Song, on_delete=models.SET_NULL, null=True, blank=True)
    is_playing = models.BooleanField(default=False)
    position_seconds = models.FloatField(default=0)
    state_changed_at = models.DateTimeField(auto_now_add=True)
    revision = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class ListeningMember(models.Model):
    group = models.ForeignKey(ListeningGroup, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listening_memberships")
    connection_count = models.PositiveIntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("group", "user"), name="listening_group_user_unique"),
        ]
