from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ListeningGroup
from .serializers import ListeningGroupSerializer


class ListeningGroupCreateView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ListeningGroupSerializer

    def post(self, request):
        group = ListeningGroup.objects.create(created_by=request.user)
        group.member_count = 0
        return Response(self.get_serializer(group).data, status=status.HTTP_201_CREATED)


class ListeningGroupInviteView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ListeningGroupSerializer

    def get(self, request, invite_code):
        group = get_object_or_404(
            ListeningGroup.objects.annotate(
                member_count=Count("members", filter=Q(members__connection_count__gt=0))
            ),
            invite_code=invite_code,
        )
        return Response(self.get_serializer(group).data)
