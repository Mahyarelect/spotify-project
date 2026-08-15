from rest_framework import serializers

from .models import ListeningGroup


class ListeningGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ListeningGroup
        fields = ("id", "invite_code", "member_count", "created_at")
        read_only_fields = fields
