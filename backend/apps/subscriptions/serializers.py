from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.accounts.serializers.profile import CurrentSubscriptionSerializer, RejectUnknownFieldsMixin

from .models import SubscriptionOrder, SubscriptionPlan
from .selectors import get_effective_entitlements


class PlanLimitsSerializer(serializers.Serializer):
    daily_stream_limit = serializers.IntegerField(allow_null=True)
    max_playlists = serializers.IntegerField(allow_null=True)
    profile_image_allowed = serializers.BooleanField()
    download_allowed = serializers.BooleanField()
    early_access_allowed = serializers.BooleanField()
    statistics_allowed = serializers.BooleanField()


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    allowed_billing_months = serializers.SerializerMethodField()
    limits = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = ("code", "display_name", "monthly_price", "currency", "allowed_billing_months", "limits")

    @extend_schema_field(serializers.ListField(child=serializers.IntegerField()))
    def get_allowed_billing_months(self, plan):
        return list(SubscriptionOrder.Months.values) if plan.code != SubscriptionPlan.Code.FREE else []

    @extend_schema_field(PlanLimitsSerializer)
    def get_limits(self, plan):
        return {
            "daily_stream_limit": plan.daily_stream_limit,
            "max_playlists": plan.max_playlists,
            "profile_image_allowed": plan.profile_image_allowed,
            "download_allowed": plan.download_allowed,
            "early_access_allowed": plan.early_access_allowed,
            "statistics_allowed": plan.statistics_allowed,
        }


class CurrentSubscriptionResponseSerializer(CurrentSubscriptionSerializer):
    pass


def serialize_current_subscription(user):
    entitlement = get_effective_entitlements(user)
    return {
        "plan": entitlement.plan_code,
        "status": entitlement.status,
        "starts_at": entitlement.starts_at,
        "expires_at": entitlement.expires_at,
        "limits": {
            "daily_stream_limit": entitlement.daily_stream_limit,
            "max_playlists": entitlement.max_playlists,
            "profile_image_allowed": entitlement.profile_image_allowed,
            "download_allowed": entitlement.download_allowed,
            "early_access_allowed": entitlement.early_access_allowed,
            "statistics_allowed": entitlement.statistics_allowed,
        },
    }


class SubscriptionOrderCreateSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    plan = serializers.ChoiceField(choices=SubscriptionPlan.Code.choices)
    months = serializers.ChoiceField(choices=SubscriptionOrder.Months.choices)
    idempotency_key = serializers.CharField(max_length=100)


class SubscriptionOrderSerializer(serializers.ModelSerializer):
    order_id = serializers.UUIDField(source="id")
    plan = serializers.CharField(source="plan.code")
    unit_price = serializers.DecimalField(source="unit_price_snapshot", max_digits=10, decimal_places=2)
    payment_url = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionOrder
        fields = (
            "order_id",
            "status",
            "plan",
            "months",
            "unit_price",
            "total_amount",
            "currency",
            "payment_url",
            "created_at",
            "paid_at",
        )

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_payment_url(self, order):
        return None


class PlanPriceUpdateSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    monthly_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
