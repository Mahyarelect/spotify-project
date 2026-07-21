from datetime import date

from PIL import Image, UnidentifiedImageError
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.subscriptions.selectors import get_effective_entitlements

from ..models import User, UserPreference


class RejectUnknownFieldsMixin:
    def to_internal_value(self, data):
        unknown = set(data.keys()) - set(self.fields.keys())
        if unknown:
            raise serializers.ValidationError({field: ["Unknown field."] for field in sorted(unknown)})
        return super().to_internal_value(data)


class UserPreferenceSerializer(RejectUnknownFieldsMixin, serializers.ModelSerializer):
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


class ProfileUpdateSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    display_name = serializers.CharField(max_length=150, required=False)
    bio = serializers.CharField(max_length=300, allow_blank=True, required=False)
    birth_date = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False)
    avatar = serializers.ImageField(required=False, write_only=True)

    def validate_birth_date(self, value):
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if value > today or age < 13 or age > 120:
            raise serializers.ValidationError("Please enter a valid birth date for a user aged 13 to 120.")
        return value

    def validate_avatar(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Profile images must be 5 MB or smaller.")
        try:
            image = Image.open(value)
            image.verify()
            image_format = image.format
        except (UnidentifiedImageError, OSError, SyntaxError) as error:
            raise serializers.ValidationError("Upload a valid image.") from error
        finally:
            value.seek(0)
        if image_format not in {"JPEG", "PNG", "WEBP"}:
            raise serializers.ValidationError("Only JPEG, PNG, and WebP images are supported.")
        return value


class AccountDeleteSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)


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


class PublicProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    followers_count = serializers.IntegerField(source="followers_count_value", read_only=True)
    following_count = serializers.IntegerField(source="following_count_value", read_only=True)
    is_following = serializers.BooleanField(source="is_following_value", read_only=True)
    plan = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "display_name",
            "avatar_url",
            "bio",
            "role",
            "artist_verified",
            "plan",
            "followers_count",
            "following_count",
            "is_following",
        )

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_avatar_url(self, user):
        if not user.avatar:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(user.avatar.url) if request else user.avatar.url

    @extend_schema_field(serializers.ChoiceField(choices=("free", "silver", "gold")))
    def get_plan(self, user):
        return get_effective_entitlements(user).plan_code
