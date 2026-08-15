from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListCreateAPIView, RetrieveAPIView
from rest_framework.response import Response

from apps.accounts.models import User
from apps.common.permissions import IsSupportOrAdmin
from .models import SupportTicket, TicketMessage
from .serializers import (
    SupportTicketSerializer, TicketCreateSerializer, TicketMessageCreateSerializer, TicketUpdateSerializer,
)


def _can_access(user, ticket):
    return ticket.created_by_id == user.id or (
        user.is_staff and user.role in {User.Role.SUPPORT, User.Role.ADMIN}
    )


class TicketListCreateView(ListCreateAPIView):
    def get_serializer_class(self):
        return TicketCreateSerializer if self.request.method == "POST" else SupportTicketSerializer

    def get_queryset(self):
        queryset = SupportTicket.objects.select_related("created_by", "assigned_to").prefetch_related("messages__sender")
        user = self.request.user
        if not (user.is_staff and user.role in {User.Role.SUPPORT, User.Role.ADMIN}):
            queryset = queryset.filter(created_by=user)
        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = SupportTicket.objects.create(
            created_by=request.user,
            subject=serializer.validated_data["subject"],
            priority=serializer.validated_data["priority"],
        )
        TicketMessage.objects.create(ticket=ticket, sender=request.user, content=serializer.validated_data["message"])
        from apps.notifications.models import Notification
        from apps.notifications.services import create_notification
        for recipient in User.objects.filter(role__in=(User.Role.SUPPORT, User.Role.ADMIN), is_active=True, preferences__notify_ticket_updates=True):
            create_notification(user=recipient, type=Notification.Type.TICKET_UPDATE, title="New support ticket", message=ticket.subject, link="/admin-dashboard")
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class TicketDetailView(RetrieveAPIView):
    queryset = SupportTicket.objects.select_related("created_by", "assigned_to").prefetch_related("messages__sender")
    serializer_class = SupportTicketSerializer

    def get_object(self):
        ticket = super().get_object()
        if not _can_access(self.request.user, ticket):
            self.permission_denied(self.request)
        return ticket


class TicketMessageCreateView(GenericAPIView):
    serializer_class = TicketMessageCreateSerializer

    def post(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        if not _can_access(request.user, ticket):
            self.permission_denied(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        TicketMessage.objects.create(ticket=ticket, sender=request.user, **serializer.validated_data)
        if request.user.id != ticket.created_by_id:
            from apps.notifications.models import Notification
            from apps.notifications.services import create_notification
            create_notification(user=ticket.created_by, type=Notification.Type.TICKET_UPDATE, title="Support ticket updated", message=ticket.subject, link=f"/tickets/{ticket.id}")
        ticket.save(update_fields=("updated_at",))
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class TicketManageView(GenericAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = TicketUpdateSerializer

    def patch(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for name, value in serializer.validated_data.items():
            setattr(ticket, name, value)
        ticket.save()
        return Response(SupportTicketSerializer(ticket).data)
