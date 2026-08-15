from rest_framework import serializers

from apps.accounts.models import User
from apps.accounts.serializers.profile import RejectUnknownFieldsMixin
from .models import SupportTicket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.display_name", read_only=True)

    class Meta:
        model = TicketMessage
        fields = ("id", "sender", "sender_name", "content", "created_at")
        read_only_fields = fields


class SupportTicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="created_by.display_name", read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = ("id", "created_by", "user_name", "assigned_to", "subject", "status", "priority", "messages", "created_at", "updated_at")
        read_only_fields = fields


class TicketCreateSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField(max_length=5000)
    priority = serializers.ChoiceField(choices=SupportTicket.Priority.choices, default=SupportTicket.Priority.MEDIUM)


class TicketMessageCreateSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    content = serializers.CharField(max_length=5000)


class TicketUpdateSerializer(RejectUnknownFieldsMixin, serializers.Serializer):
    status = serializers.ChoiceField(choices=SupportTicket.Status.choices, required=False)
    priority = serializers.ChoiceField(choices=SupportTicket.Priority.choices, required=False)
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=(User.Role.SUPPORT, User.Role.ADMIN), is_active=True),
        allow_null=True, required=False,
    )

