from datetime import date, datetime
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.accounts.tests.factories import UserFactory
from apps.payments.models import ArtistPayout
from apps.music.models import Stream
from apps.music.tests.factories import SongFactory
from apps.notifications.models import Notification
from apps.subscriptions.models import SubscriptionOrder, SubscriptionPlan, UserSubscription

pytestmark = pytest.mark.django_db


def client_for(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def test_only_admin_can_generate_and_transition_payouts():
    admin = UserFactory(role=User.Role.ADMIN, is_staff=True, is_superuser=True)
    support = UserFactory(role=User.Role.SUPPORT, is_staff=True)
    artist = UserFactory(role=User.Role.ARTIST, artist_verified=True)
    payload = {"month": "2026-07-01", "rate_per_stream": "0.003000", "currency": "USD"}
    assert client_for(support).post("/api/v1/admin/payouts/generate/", payload, format="json").status_code == 403
    response = client_for(admin).post("/api/v1/admin/payouts/generate/", payload, format="json")
    assert response.status_code == 201
    payout = ArtistPayout.objects.get(artist=artist, month=date(2026, 7, 1))
    assert payout.amount == Decimal("0.00")
    notice = Notification.objects.get(user=artist, type=Notification.Type.MONTHLY_FINANCIAL)
    assert notice.link == "/artist-dashboard"
    assert client_for(support).patch(f"/api/v1/admin/payouts/{payout.id}/status/", {"status": "approved"}, format="json").status_code == 403
    assert client_for(admin).patch(f"/api/v1/admin/payouts/{payout.id}/status/", {"status": "approved"}, format="json").status_code == 200
    paid = client_for(admin).patch(f"/api/v1/admin/payouts/{payout.id}/status/", {"status": "paid", "provider_reference": "bank-123"}, format="json")
    assert paid.status_code == 200
    assert paid.data["status"] == "paid"


def test_monthly_payout_reports_distinct_listeners():
    admin = UserFactory(role=User.Role.ADMIN, is_staff=True, is_superuser=True)
    artist = UserFactory(role=User.Role.ARTIST, artist_verified=True)
    first, second = UserFactory(), UserFactory()
    song = SongFactory(artist=artist, album=None)
    rows = [
        Stream.objects.create(user=first, song=song),
        Stream.objects.create(user=first, song=song),
        Stream.objects.create(user=second, song=song),
    ]
    for day, stream in enumerate(rows, start=10):
        Stream.objects.filter(pk=stream.pk).update(
            streamed_at=timezone.make_aware(datetime(2026, 7, day, 10, 0))
        )

    response = client_for(admin).post(
        "/api/v1/admin/payouts/generate/",
        {"month": "2026-07-01", "rate_per_stream": "0.003000", "currency": "USD"},
        format="json",
    )
    row = next(item for item in response.data if str(item["artist"]) == str(artist.id))
    assert row["total_streams"] == 3
    assert row["unique_listeners"] == 2


def test_artist_sees_only_own_reports():
    admin = UserFactory(role=User.Role.ADMIN, is_staff=True, is_superuser=True)
    artist = UserFactory(role=User.Role.ARTIST, artist_verified=True)
    other = UserFactory(role=User.Role.ARTIST, artist_verified=True)
    for subject in (artist, other):
        ArtistPayout.objects.create(artist=subject, month=date(2026, 7, 1), rate_per_stream="0.003000", amount="1.00", currency="USD", generated_by=admin)
    response = client_for(artist).get("/api/v1/artist/payouts/")
    assert response.status_code == 200
    assert len(response.data) == 1
    assert str(response.data[0]["artist"]) == str(artist.id)


def test_admin_revenue_report_uses_payment_records_and_is_admin_only():
    admin = UserFactory(role=User.Role.ADMIN, is_staff=True, is_superuser=True)
    support = UserFactory(role=User.Role.SUPPORT, is_staff=True)
    listener = UserFactory(role=User.Role.LISTENER)
    gold = SubscriptionPlan.objects.get(code=SubscriptionPlan.Code.GOLD)
    UserSubscription.objects.filter(user=listener).update(plan=gold)
    SubscriptionOrder.objects.create(
        user=listener,
        plan=gold,
        months=1,
        unit_price_snapshot="9.00",
        total_amount="9.00",
        currency="USD",
        status=SubscriptionOrder.Status.PAID,
        idempotency_key="revenue-report-test",
    )

    assert client_for(support).get("/api/v1/admin/reports/revenue/").status_code == 403
    response = client_for(admin).get("/api/v1/admin/reports/revenue/")
    assert response.status_code == 200
    assert Decimal(response.data["total_revenue"]) == Decimal("9.00")
    assert any(row["tier"] == "gold" and row["count"] == 1 for row in response.data["by_tier"])
