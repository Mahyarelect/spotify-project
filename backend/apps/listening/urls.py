from django.urls import path

from .views import ListeningGroupCreateView, ListeningGroupInviteView


urlpatterns = [
    path("listening-groups/", ListeningGroupCreateView.as_view(), name="listening-group-create"),
    path("listening-groups/<str:invite_code>/", ListeningGroupInviteView.as_view(), name="listening-group-invite"),
]
