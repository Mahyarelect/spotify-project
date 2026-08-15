import pytest
from rest_framework.test import APIClient
from apps.accounts.tests.factories import UserFactory
from apps.notifications.models import Notification

pytestmark = pytest.mark.django_db


def client_for(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def test_notifications_are_private_and_can_be_marked_read():
    user = UserFactory()
    other = UserFactory()
    notification = Notification.objects.create(user=user, type=Notification.Type.ANNOUNCEMENT, title="Hello", message="World")
    Notification.objects.create(user=other, type=Notification.Type.ANNOUNCEMENT, title="Private", message="Other")
    response = client_for(user).get("/api/v1/notifications/")
    assert response.status_code == 200
    assert [item["id"] for item in response.data] == [str(notification.id)]
    assert client_for(other).post(f"/api/v1/notifications/{notification.id}/read/").status_code == 404
    assert client_for(user).post(f"/api/v1/notifications/{notification.id}/read/").status_code == 204
    notification.refresh_from_db()
    assert notification.read_at is not None

