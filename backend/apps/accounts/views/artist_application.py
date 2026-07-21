from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.response import Response

from apps.common.permissions import IsSupportOrAdmin

from ..serializers.artist_application import (
    ArtistApplicationRejectionSerializer,
    ArtistApplicationAdminSerializer,
    ArtistApplicationReviewSerializer,
)
from ..services import approve_artist_application, reject_artist_application
from ..models import ArtistApplication


class ArtistApplicationListView(ListAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = ArtistApplicationAdminSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = ArtistApplication.objects.select_related("user").order_by("-submitted_at")
        status_filter = self.request.query_params.get("status")
        if status_filter in ArtistApplication.Status.values:
            queryset = queryset.filter(status=status_filter)
        return queryset


class ArtistApplicationApproveView(GenericAPIView):
    permission_classes = (IsSupportOrAdmin,)

    @extend_schema(request=None, responses={200: ArtistApplicationReviewSerializer})
    def post(self, request, application_id):
        application = approve_artist_application(application_id=application_id, reviewer=request.user)
        return Response(ArtistApplicationReviewSerializer(application).data, status=status.HTTP_200_OK)


class ArtistApplicationRejectView(GenericAPIView):
    permission_classes = (IsSupportOrAdmin,)
    serializer_class = ArtistApplicationRejectionSerializer

    @extend_schema(responses={200: ArtistApplicationReviewSerializer})
    def post(self, request, application_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = reject_artist_application(
            application_id=application_id,
            reviewer=request.user,
            reason=serializer.validated_data["reason"],
        )
        return Response(ArtistApplicationReviewSerializer(application).data, status=status.HTTP_200_OK)
