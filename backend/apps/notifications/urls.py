from django.urls import path
from .views import NotificationDeleteView, NotificationListView, NotificationReadAllView, NotificationReadView, NotificationUnreadCountView

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/unread-count/", NotificationUnreadCountView.as_view(), name="notification-unread-count"),
    path("notifications/read-all/", NotificationReadAllView.as_view(), name="notification-read-all"),
    path("notifications/<uuid:pk>/read/", NotificationReadView.as_view(), name="notification-read"),
    path("notifications/<uuid:pk>/", NotificationDeleteView.as_view(), name="notification-delete"),
]

