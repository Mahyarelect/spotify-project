from django.http import JsonResponse
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import serializers


@extend_schema(
    responses={200: inline_serializer("HealthResponse", fields={"status": serializers.CharField()})}
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return JsonResponse({"status": "ok"})
