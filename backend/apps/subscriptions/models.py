import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class SubscriptionPlan(models.Model):
    class Code(models.TextChoices):
        FREE = "free", "Free"
        SILVER = "silver", "Silver"
        GOLD = "gold", "Gold"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=16, choices=Code.choices, unique=True)
    display_name = models.CharField(max_length=50)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3)
    daily_stream_limit = models.PositiveIntegerField(null=True, blank=True)
    max_playlists = models.PositiveIntegerField(null=True, blank=True)
    profile_image_allowed = models.BooleanField(default=False)
    download_allowed = models.BooleanField(default=False)
    early_access_allowed = models.BooleanField(default=False)
    statistics_allowed = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("monthly_price",)
        constraints = [
            models.CheckConstraint(
                condition=~Q(code="free") | Q(monthly_price=0),
                name="subscriptions_free_plan_zero_price",
            ),
        ]

    def __str__(self) -> str:
        return self.display_name


class UserSubscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name="user_subscriptions")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    starts_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    source_order = models.OneToOneField(
        "SubscriptionOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activated_subscription",
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.email}: {self.plan.code}"


class SubscriptionOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    class Months(models.IntegerChoices):
        ONE = 1, "1 month"
        THREE = 3, "3 months"
        SIX = 6, "6 months"
        TWELVE = 12, "12 months"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription_orders")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name="orders")
    months = models.PositiveSmallIntegerField(choices=Months.choices)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    idempotency_key = models.CharField(max_length=100)
    provider_reference = models.CharField(max_length=150, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=("user", "idempotency_key"), name="subscriptions_order_user_key_unique"),
        ]

    def __str__(self) -> str:
        return f"{self.user.email}: {self.plan.code} x {self.months}"
