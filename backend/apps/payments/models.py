import uuid
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class ArtistPayout(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        PAID = "paid", "Paid"
        DISPUTED = "disputed", "Disputed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="artist_payouts")
    month = models.DateField(help_text="First day of the reporting month.")
    total_streams = models.PositiveIntegerField(default=0)
    rate_per_stream = models.DecimalField(max_digits=10, decimal_places=6, validators=[MinValueValidator(0)])
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    provider_reference = models.CharField(max_length=150, unique=True, null=True, blank=True)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="generated_payouts")
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name="reviewed_payouts")
    generated_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-month", "artist__display_name")
        constraints = [models.UniqueConstraint(fields=("artist", "month"), name="payments_artist_month_unique")]
        indexes = [models.Index(fields=("month", "status"), name="payments_month_status_idx")]

