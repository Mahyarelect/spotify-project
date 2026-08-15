from rest_framework import status
from decimal import Decimal

from django.db.models import Count, Sum
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.response import Response
from apps.accounts.models import User
from apps.common.permissions import AllowedRoles, IsAdminRole
from .models import ArtistPayout
from apps.music.models import Stream
from apps.subscriptions.models import SubscriptionOrder, UserSubscription
from .serializers import ArtistPayoutSerializer, GeneratePayoutsSerializer, PayoutStatusSerializer, RevenueStatsSerializer
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


class RevenueStatsView(GenericAPIView):
    permission_classes = (IsAdminRole,)
    serializer_class = RevenueStatsSerializer

    def get(self, request):
        total_revenue = SubscriptionOrder.objects.filter(
            status=SubscriptionOrder.Status.PAID,
        ).aggregate(total=Sum("total_amount"))["total"] or Decimal("0")
        payout_totals = ArtistPayout.objects.values("status").annotate(total=Sum("amount"))
        totals_by_status = {row["status"]: row["total"] for row in payout_totals}
        tiers = (
            UserSubscription.objects.filter(status=UserSubscription.Status.ACTIVE)
            .values("plan__code", "plan__monthly_price")
            .annotate(count=Count("id"))
            .order_by("plan__monthly_price")
        )
        data = {
            "total_revenue": total_revenue,
            "total_streams": Stream.objects.count(),
            "paid_amount": totals_by_status.get(ArtistPayout.Status.PAID, Decimal("0")),
            "pending_amount": (
                totals_by_status.get(ArtistPayout.Status.PENDING, Decimal("0"))
                + totals_by_status.get(ArtistPayout.Status.APPROVED, Decimal("0"))
            ),
            "by_tier": [
                {
                    "tier": row["plan__code"],
                    "count": row["count"],
                    "revenue": row["plan__monthly_price"] * row["count"],
                }
                for row in tiers
            ],
        }
        return Response(self.get_serializer(data).data)
