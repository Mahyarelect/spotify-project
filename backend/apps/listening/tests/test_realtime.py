from datetime import date

import pytest
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import User
from apps.listening.models import ListeningGroup
from apps.music.models import Song
from config.asgi import application


pytestmark = pytest.mark.django_db(transaction=True)


@sync_to_async
def create_user(email):
    return User.objects.create_user(
        email=email,
        password="VeryStrongPass908!",
        display_name=email.split("@")[0],
        birth_date=date(2000, 1, 1),
        role=User.Role.LISTENER,
    )


@sync_to_async
def create_group(user):
    return ListeningGroup.objects.create(created_by=user)


@sync_to_async
def create_song(user):
    song = Song(
        title="Shared song",
        artist=user,
        duration_sec=180,
        cover_color="#16a34a",
    )
    song.audio_file = "songs/shared.mp3"
    song.save()
    return song


@sync_to_async
def group_exists(group_id):
    return ListeningGroup.objects.filter(pk=group_id).exists()


def protocols(user):
    return ["spotify.jwt", str(AccessToken.for_user(user))]


@pytest.mark.asyncio
async def test_last_disconnect_deletes_temporary_group():
    user = await create_user("one@example.com")
    group = await create_group(user)
    communicator = WebsocketCommunicator(
        application,
        f"/ws/listening/{group.invite_code}/",
        subprotocols=protocols(user),
    )

    connected, subprotocol = await communicator.connect()
    assert connected is True
    assert subprotocol == "spotify.jwt"
    state = await communicator.receive_json_from()
    assert state["memberCount"] == 1

    await communicator.disconnect()
    assert await group_exists(group.id) is False


@pytest.mark.asyncio
async def test_song_and_playback_changes_broadcast_to_every_member():
    first = await create_user("first@example.com")
    second = await create_user("second@example.com")
    group = await create_group(first)
    song = await create_song(first)
    sockets = [
        WebsocketCommunicator(application, f"/ws/listening/{group.invite_code}/", subprotocols=protocols(user))
        for user in (first, second)
    ]
    for socket in sockets:
        assert (await socket.connect())[0] is True
        await socket.receive_json_from()
    await sockets[0].receive_json_from()

    await sockets[0].send_json_to({"type": "command", "action": "play", "songId": str(song.id), "position": 12})

    first_state = await sockets[0].receive_json_from()
    second_state = await sockets[1].receive_json_from()
    assert first_state["song"]["id"] == second_state["song"]["id"] == str(song.id)
    assert first_state["isPlaying"] is second_state["isPlaying"] is True
    assert 12 <= second_state["position"] < 14

    await sockets[0].disconnect()
    await sockets[1].receive_json_from()
    await sockets[1].disconnect()
