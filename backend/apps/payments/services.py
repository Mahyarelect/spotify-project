from datetime import datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from apps.accounts.models import User
from apps.common.domain import DomainError
from apps.music.models import Stream
from .models import ArtistPayout


@transaction.atomic
def generate_monthly_payouts(*, month, rate_per_stream, currency, generated_by):
    if generated_by.role != User.Role.ADMIN:
        raise DomainError("admin_required", "Only administrators can generate payouts.", status_code=403)
    next_month = (month.replace(day=28) + timedelta(days=4)).replace(day=1)
    start_at = timezone.make_aware(datetime.combine(month, time.min))
    end_at = timezone.make_aware(datetime.combine(next_month, time.min))
    counts = dict(
        Stream.objects.filter(streamed_at__gte=start_at, streamed_at__lt=end_at)
        .values("song__artist_id").annotate(total=Count("id")).values_list("song__artist_id", "total")
    )
    payouts = []
    for artist in User.objects.filter(role=User.Role.ARTIST, artist_verified=True, is_active=True):
        streams = counts.get(artist.id, 0)
        amount = (Decimal(streams) * rate_per_stream).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        payout, _ = ArtistPayout.objects.get_or_create(
            artist=artist, month=month,
            defaults={"total_streams": streams, "rate_per_stream": rate_per_stream, "amount": amount, "currency": currency.upper(), "generated_by": generated_by},
        )
        from apps.notifications.models import Notification
        from apps.notifications.services import create_notification
        if not Notification.objects.filter(user=artist, type=Notification.Type.MONTHLY_FINANCIAL, link=f"/artist/payouts/{payout.id}").exists():
            create_notification(
                user=artist, type=Notification.Type.MONTHLY_FINANCIAL,
                title="Monthly financial report ready",
                message=f"Your financial report for {month:%B %Y} is ready.",
                link=f"/artist/payouts/{payout.id}",
            )
        payouts.append(payout)
    return payouts


@transaction.atomic
def transition_payout(*, payout_id, next_status, reviewer, provider_reference=None):
    if reviewer.role != User.Role.ADMIN:
        raise DomainError("admin_required", "Only administrators can change payout status.", status_code=403)
    payout = ArtistPayout.objects.select_for_update().get(pk=payout_id)
    allowed = {
        ArtistPayout.Status.PENDING: {ArtistPayout.Status.APPROVED, ArtistPayout.Status.DISPUTED},
        ArtistPayout.Status.APPROVED: {ArtistPayout.Status.PAID, ArtistPayout.Status.DISPUTED},
        ArtistPayout.Status.DISPUTED: {ArtistPayout.Status.APPROVED},
        ArtistPayout.Status.PAID: set(),
    }
    if next_status == payout.status:
        return payout
    if next_status not in allowed[payout.status]:
        raise DomainError("invalid_payout_transition", f"Cannot change payout from {payout.status} to {next_status}.", status_code=409)
    payout.status = next_status
    payout.reviewed_by = reviewer
    payout.reviewed_at = timezone.now()
    if next_status == ArtistPayout.Status.PAID:
        payout.provider_reference = provider_reference
        payout.paid_at = timezone.now()
    payout.save()
    return payout
