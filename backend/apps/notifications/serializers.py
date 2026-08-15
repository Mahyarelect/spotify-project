from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ("id", "type", "title", "message", "link", "read", "read_at", "created_at")
        read_only_fields = fields

    def get_read(self, obj) -> bool:
        return obj.read_at is not None


class UnreadCountSerializer(serializers.Serializer):
    count = serializers.IntegerField()


class NotificationMutationSerializer(serializers.Serializer):
    pass
