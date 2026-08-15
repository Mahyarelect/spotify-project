from django.urls import path
from .views import TicketDetailView, TicketListCreateView, TicketManageView, TicketMessageCreateView

urlpatterns = [
    path("tickets/", TicketListCreateView.as_view(), name="ticket-list-create"),
    path("tickets/<uuid:pk>/", TicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<uuid:pk>/messages/", TicketMessageCreateView.as_view(), name="ticket-message-create"),
    path("support/tickets/<uuid:pk>/", TicketManageView.as_view(), name="ticket-manage"),
]

