from rest_framework import serializers
from apps.accounts.serializers.profile import RejectUnknownFieldsMixin
from .models import ArtistPayout


class ArtistPayoutSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.display_name", read_only=True)

    class Meta:
        model = ArtistPayout
        fields = ("id", "artist", "artist_name", "month", "total_streams", "rate_per_stream", "amount", "currency", "status", "provider_reference", "generated_at", "reviewed_at", "paid_at")
        read_only_fields = fields


class GeneratePayoutsSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    month = serializers.DateField()
    rate_per_stream = serializers.DecimalField(max_digits=10, decimal_places=6, min_value=0, default="0.003000")
    currency = serializers.CharField(max_length=3, default="USD")

    def validate_month(self, value):
        if value.day != 1:
            raise serializers.ValidationError("Month must be the first day of a calendar month.")
        return value


class PayoutStatusSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    status = serializers.ChoiceField(choices=(ArtistPayout.Status.APPROVED, ArtistPayout.Status.PAID, ArtistPayout.Status.DISPUTED))
    provider_reference = serializers.CharField(max_length=150, required=False)

    def validate(self, attrs):
        if attrs["status"] == ArtistPayout.Status.PAID and not attrs.get("provider_reference"):
            raise serializers.ValidationError({"provider_reference": ["Required when marking a payout paid."]})
        return attrs


class RevenueTierSerializer(serializers.Serializer):
    tier = serializers.CharField()
    count = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=14, decimal_places=2)


class RevenueStatsSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_streams = serializers.IntegerField()
    paid_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    by_tier = RevenueTierSerializer(many=True)
