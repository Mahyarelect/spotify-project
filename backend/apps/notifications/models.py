import uuid
from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_RELEASE = "new_release", "New release"
        SUBSCRIPTION_EXPIRY = "subscription_expiry", "Subscription expiry"
        ARTIST_APPROVED = "artist_approved", "Artist approved"
        ARTIST_REJECTED = "artist_rejected", "Artist rejected"
        TICKET_UPDATE = "ticket_update", "Ticket update"
        MONTHLY_FINANCIAL = "monthly_financial", "Monthly financial"
        ANNOUNCEMENT = "announcement", "Announcement"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=32, choices=Type.choices, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField(max_length=2000)
    link = models.CharField(max_length=500, blank=True)
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("user", "read_at", "created_at"), name="notif_user_read_time_idx")]

