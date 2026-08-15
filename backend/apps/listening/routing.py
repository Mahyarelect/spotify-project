from django.urls import re_path

from .consumers import ListeningGroupConsumer


websocket_urlpatterns = [
    re_path(r"^ws/listening/(?P<invite_code>[-_A-Za-z0-9]+)/$", ListeningGroupConsumer.as_asgi()),
]
