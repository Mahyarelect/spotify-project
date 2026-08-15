from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.response import Response
from apps.accounts.models import User
from apps.common.permissions import AllowedRoles, IsAdminRole
from .models import ArtistPayout
from .serializers import ArtistPayoutSerializer, GeneratePayoutsSerializer, PayoutStatusSerializer
from .services import generate_monthly_payouts, transition_payout


class ArtistPayoutListView(ListAPIView):
    serializer_class = ArtistPayoutSerializer
    permission_classes = (AllowedRoles,)
    allowed_roles = {User.Role.ARTIST, User.Role.ADMIN}

    def get_queryset(self):
        user = self.request.user
        queryset = ArtistPayout.objects.select_related("artist")
        if user.role == User.Role.ADMIN:
            month = self.request.query_params.get("month")
            return queryset.filter(month=month) if month else queryset
        if user.role == User.Role.ARTIST:
            return queryset.filter(artist=user)
        return queryset.none()


class GeneratePayoutsView(GenericAPIView):
    permission_classes = (IsAdminRole,)
    serializer_class = GeneratePayoutsSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payouts = generate_monthly_payouts(generated_by=request.user, **serializer.validated_data)
        return Response(ArtistPayoutSerializer(payouts, many=True).data, status=status.HTTP_201_CREATED)


class PayoutStatusView(GenericAPIView):
    permission_classes = (IsAdminRole,)
    serializer_class = PayoutStatusSerializer

    def patch(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payout = transition_payout(payout_id=pk, reviewer=request.user, next_status=serializer.validated_data["status"], provider_reference=serializer.validated_data.get("provider_reference"))
        return Response(ArtistPayoutSerializer(payout).data)
