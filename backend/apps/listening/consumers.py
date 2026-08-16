import asyncio
from contextlib import suppress

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.db import transaction
from django.db.models import F, Sum
from django.utils import timezone

from apps.music.models import Song
from apps.subscriptions.services import get_effective_entitlements

from .models import ListeningGroup, ListeningMember


def _song_payload(song):
    if song is None:
        return None
    return {
        "id": str(song.id),
        "title": song.title,
        "artistName": song.artist.display_name,
        "artistUsername": song.artist.username,
        "artistId": str(song.artist_id),
        "albumId": str(song.album_id or ""),
        "durationSec": song.duration_sec,
        "coverColor": song.cover_color,
        "coverImage": song.cover_image.url if song.cover_image else None,
        "audioFile": song.audio_file.url if song.audio_file else None,
        "hasAudio": bool(song.audio_file),
        "playCount": song.play_count,
        "genre": song.genre or None,
        "releaseYear": song.release_year,
    }


def _position(group, now=None):
    position = group.position_seconds
    if group.is_playing and group.current_song_id:
        now = now or timezone.now()
        position += max(0, (now - group.state_changed_at).total_seconds())
    if group.current_song:
        position = min(position, group.current_song.duration_sec)
    return round(max(0, position), 3)


def _state_payload(group, member_count):
    return {
        "type": "state",
        "song": _song_payload(group.current_song),
        "isPlaying": group.is_playing,
        "position": _position(group),
        "revision": group.revision,
        "memberCount": member_count,
        "serverTime": timezone.now().isoformat(),
    }


class ListeningGroupConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return
        self.invite_code = self.scope["url_route"]["kwargs"]["invite_code"]
        joined = await self._join(user.id, self.invite_code)
        if joined is None:
            await self.close(code=4404)
            return
        self.group_id, payload = joined
        self.channel_group_name = f"listening_{self.group_id}"
        await self.channel_layer.group_add(self.channel_group_name, self.channel_name)
        await self.accept(subprotocol="spotify.jwt")
        await self.channel_layer.group_send(self.channel_group_name, {"type": "playback.state", "payload": payload})
        self.heartbeat_task = asyncio.create_task(self._heartbeat())

    async def disconnect(self, close_code):
        if not hasattr(self, "group_id"):
            return
        if hasattr(self, "heartbeat_task"):
            self.heartbeat_task.cancel()
            with suppress(asyncio.CancelledError):
                await self.heartbeat_task
        await self.channel_layer.group_discard(self.channel_group_name, self.channel_name)
        payload = await self._leave(self.scope["user"].id, self.group_id)
        if payload is not None:
            await self.channel_layer.group_send(self.channel_group_name, {"type": "playback.state", "payload": payload})

    async def receive_json(self, content, **kwargs):
        if content.get("type") != "command":
            return
        payload = await self._apply_command(
            self.group_id,
            self.scope["user"].id,
            str(content.get("action", "")),
            content.get("songId"),
            content.get("position"),
        )
        if payload is not None:
            await self.channel_layer.group_send(self.channel_group_name, {"type": "playback.state", "payload": payload})

    async def playback_state(self, event):
        await self.send_json(event["payload"])

    async def _heartbeat(self):
        while True:
            await asyncio.sleep(20)
            payload = await self._current_state(self.group_id)
            if payload is None:
                await self.close(code=4404)
                return
            await self.send_json(payload)

    @database_sync_to_async
    def _join(self, user_id, invite_code):
        with transaction.atomic():
            try:
                # Lock only the group row. PostgreSQL cannot apply FOR UPDATE to
                # the nullable side of the current_song outer join.
                group = ListeningGroup.objects.select_for_update().get(invite_code=invite_code)
            except ListeningGroup.DoesNotExist:
                return None
            member, _ = ListeningMember.objects.select_for_update().get_or_create(group=group, user_id=user_id)
            member.connection_count = F("connection_count") + 1
            member.save(update_fields=("connection_count",))
            member.refresh_from_db()
            count = group.members.filter(connection_count__gt=0).count()
            return str(group.id), _state_payload(group, count)

    @database_sync_to_async
    def _leave(self, user_id, group_id):
        with transaction.atomic():
            try:
                group = ListeningGroup.objects.select_for_update().get(pk=group_id)
                member = ListeningMember.objects.select_for_update().get(group=group, user_id=user_id)
            except (ListeningGroup.DoesNotExist, ListeningMember.DoesNotExist):
                return None
            member.connection_count = max(0, member.connection_count - 1)
            if member.connection_count == 0:
                member.delete()
            else:
                member.save(update_fields=("connection_count",))
            active = group.members.aggregate(total=Sum("connection_count"))["total"] or 0
            if active == 0:
                group.delete()
                return None
            return _state_payload(group, group.members.filter(connection_count__gt=0).count())

    @database_sync_to_async
    def _apply_command(self, group_id, user_id, action, song_id, raw_position):
        if action not in {"play", "pause", "seek"}:
            return None
        with transaction.atomic():
            try:
                group = ListeningGroup.objects.select_for_update().get(pk=group_id)
            except ListeningGroup.DoesNotExist:
                return None
            now = timezone.now()
            try:
                requested_position = float(raw_position or 0)
            except (TypeError, ValueError):
                return None
            if action == "play":
                if song_id:
                    try:
                        song = Song.objects.select_related("artist", "album").exclude(audio_file="").get(pk=song_id)
                    except (Song.DoesNotExist, ValueError):
                        return None
                    if (
                        song.album_id
                        and song.album.is_early_access
                        and song.artist_id != user_id
                        and not get_effective_entitlements(group.members.get(user_id=user_id).user).early_access_allowed
                    ):
                        return None
                    group.current_song = song
                    group.position_seconds = max(0, min(requested_position, song.duration_sec))
                    group.is_playing = True
                elif group.current_song_id:
                    group.position_seconds = _position(group, now)
                    group.is_playing = True
            elif group.current_song_id:
                current = _position(group, now)
                if action == "pause":
                    group.position_seconds = current
                    group.is_playing = False
                elif action == "seek":
                    group.position_seconds = max(0, min(requested_position, group.current_song.duration_sec))
            group.state_changed_at = now
            group.revision = F("revision") + 1
            group.save(update_fields=("current_song", "position_seconds", "is_playing", "state_changed_at", "revision"))
            group.refresh_from_db()
            return _state_payload(group, group.members.filter(connection_count__gt=0).count())

    @database_sync_to_async
    def _current_state(self, group_id):
        try:
            group = ListeningGroup.objects.select_related("current_song__artist").get(pk=group_id)
        except ListeningGroup.DoesNotExist:
            return None
        return _state_payload(group, group.members.filter(connection_count__gt=0).count())
