import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.accounts.tests.factories import UserFactory
from apps.support.models import SupportTicket

pytestmark = pytest.mark.django_db


def client_for(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def test_ticket_owner_and_support_can_access_but_other_listener_cannot():
    owner = UserFactory()
    support = UserFactory(role=User.Role.SUPPORT, is_staff=True)
    other = UserFactory()
    response = client_for(owner).post("/api/v1/tickets/", {"subject": "Billing", "message": "Please help"}, format="json")
    assert response.status_code == 201
    ticket_id = response.data["id"]
    assert client_for(support).get(f"/api/v1/tickets/{ticket_id}/").status_code == 200
    assert client_for(other).get(f"/api/v1/tickets/{ticket_id}/").status_code == 403


def test_support_can_manage_ticket_but_cannot_use_admin_only_permissions():
    owner = UserFactory()
    support = UserFactory(role=User.Role.SUPPORT, is_staff=True)
    ticket = SupportTicket.objects.create(created_by=owner, subject="Playback")
    response = client_for(support).patch(f"/api/v1/support/tickets/{ticket.id}/", {"status": "resolved"}, format="json")
    assert response.status_code == 200
    ticket.refresh_from_db()
    assert ticket.status == SupportTicket.Status.RESOLVED

