from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationMutationSerializer, NotificationSerializer, UnreadCountSerializer


class NotificationListView(ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        unread = self.request.query_params.get("unread")
        return queryset.filter(read_at__isnull=True) if unread == "true" else queryset


class NotificationUnreadCountView(GenericAPIView):
    serializer_class = UnreadCountSerializer

    def get(self, request):
        return Response({"count": Notification.objects.filter(user=request.user, read_at__isnull=True).count()})


class NotificationReadView(GenericAPIView):
    serializer_class = NotificationMutationSerializer
    def post(self, request, pk):
        updated = Notification.objects.filter(pk=pk, user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        if not updated and not Notification.objects.filter(pk=pk, user=request.user).exists():
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationReadAllView(GenericAPIView):
    serializer_class = NotificationMutationSerializer
    def post(self, request):
        count = Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"updated": count})


class NotificationDeleteView(GenericAPIView):
    serializer_class = NotificationMutationSerializer
    def delete(self, request, pk):
        deleted, _ = Notification.objects.filter(pk=pk, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT if deleted else status.HTTP_404_NOT_FOUND)
