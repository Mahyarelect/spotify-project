from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.subscriptions.selectors import get_effective_entitlements

from ..models import User, UserPreference


class UserPreferenceSerializer(serializers.ModelSerializer):
    new_releases_from_followed = serializers.BooleanField(source="notify_new_releases")
    subscription_expiry = serializers.BooleanField(source="notify_subscription_expiry")
    ticket_updates = serializers.BooleanField(source="notify_ticket_updates")

    class Meta:
        model = UserPreference
        fields = (
            "new_releases_from_followed",
            "subscription_expiry",
            "ticket_updates",
            "sound_enabled",
            "language",
        )


class SubscriptionLimitsSerializer(serializers.Serializer):
    daily_stream_limit = serializers.IntegerField(allow_null=True)
    max_playlists = serializers.IntegerField(allow_null=True)
    profile_image_allowed = serializers.BooleanField()
    download_allowed = serializers.BooleanField()
    early_access_allowed = serializers.BooleanField()
    statistics_allowed = serializers.BooleanField()


class CurrentSubscriptionSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=("free", "silver", "gold"))
    status = serializers.ChoiceField(choices=("active", "expired", "cancelled"))
    starts_at = serializers.DateTimeField()
    expires_at = serializers.DateTimeField(allow_null=True)
    limits = SubscriptionLimitsSerializer()


class CurrentUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    streams_today = serializers.SerializerMethodField()
    preferences = UserPreferenceSerializer(read_only=True)
    subscription = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "display_name",
            "role",
            "birth_date",
            "gender",
            "avatar_url",
            "bio",
            "artist_verified",
            "followers_count",
            "following_count",
            "streams_today",
            "preferences",
            "subscription",
        )

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, user):
        if not user.avatar:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(user.avatar.url) if request else user.avatar.url

    @extend_schema_field(serializers.IntegerField())
    def get_followers_count(self, user):
        if hasattr(user, "followers_count_value"):
            return user.followers_count_value
        return user.followers.count()

    @extend_schema_field(serializers.IntegerField())
    def get_following_count(self, user):
        if hasattr(user, "following_count_value"):
            return user.following_count_value
        return user.following.count()

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_streams_today(self, user):
        return None

    @extend_schema_field(CurrentSubscriptionSerializer)
    def get_subscription(self, user):
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
