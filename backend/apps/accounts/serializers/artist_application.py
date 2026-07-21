from rest_framework import serializers

from ..models import ArtistApplication


class ArtistApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistApplication
        fields = ("id", "status", "submitted_at")


class ArtistApplicationReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistApplication
        fields = ("id", "artist_name", "status", "rejection_reason", "submitted_at", "reviewed_at")


class ArtistApplicationRejectionSerializer(serializers.Serializer):
    reason = serializers.CharField(allow_blank=True)
