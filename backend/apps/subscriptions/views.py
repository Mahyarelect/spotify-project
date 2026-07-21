from django.conf import settings
from django.db.models import Case, IntegerField, Value, When
from django.http import Http404
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.common.permissions import IsAdminRole

from .models import SubscriptionOrder, SubscriptionPlan
from .serializers import (
    CurrentSubscriptionResponseSerializer,
    PlanPriceUpdateSerializer,
    SubscriptionOrderCreateSerializer,
    SubscriptionOrderSerializer,
    SubscriptionPlanSerializer,
    serialize_current_subscription,
)
from .services import activate_paid_order, create_subscription_order, update_plan_price


class PlanListView(ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = SubscriptionPlanSerializer
    pagination_class = None

    def get_queryset(self):
        order = Case(
            When(code=SubscriptionPlan.Code.FREE, then=Value(0)),
            When(code=SubscriptionPlan.Code.SILVER, then=Value(1)),
            When(code=SubscriptionPlan.Code.GOLD, then=Value(2)),
            output_field=IntegerField(),
        )
        return SubscriptionPlan.objects.filter(is_active=True).order_by(order)


class CurrentSubscriptionView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CurrentSubscriptionResponseSerializer

    def get(self, request):
        return Response(serialize_current_subscription(request.user))


class SubscriptionOrderCreateView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SubscriptionOrderCreateSerializer

    @extend_schema(responses={201: SubscriptionOrderSerializer, 200: SubscriptionOrderSerializer})
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        order, created = create_subscription_order(
            user=request.user,
            plan_code=data["plan"],
            months=int(data["months"]),
            idempotency_key=data["idempotency_key"],
        )
        return Response(
            SubscriptionOrderSerializer(order).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class SubscriptionOrderDetailView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SubscriptionOrderSerializer

    def get(self, request, order_id):
        order = get_object_or_404(
            SubscriptionOrder.objects.select_related("plan"),
            pk=order_id,
            user=request.user,
        )
        return Response(self.get_serializer(order).data)


class MockSubscriptionConfirmationView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SubscriptionOrderSerializer

    @extend_schema(request=None, responses={200: SubscriptionOrderSerializer})
    def post(self, request, order_id):
        if not settings.DEBUG:
            raise Http404
        order = get_object_or_404(SubscriptionOrder, pk=order_id, user=request.user)
        order = activate_paid_order(order.id, f"mock:{order.id}")
        return Response(self.get_serializer(order).data)


class AdminPlanPriceUpdateView(GenericAPIView):
    permission_classes = (IsAdminRole,)
    serializer_class = PlanPriceUpdateSerializer

    @extend_schema(responses={200: SubscriptionPlanSerializer})
    def patch(self, request, code):
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if "monthly_price" not in serializer.validated_data:
            raise ValidationError({"monthly_price": ["This field is required."]})
        try:
            plan = update_plan_price(
                actor=request.user,
                code=code,
                monthly_price=serializer.validated_data["monthly_price"],
            )
        except SubscriptionPlan.DoesNotExist:
            raise Http404 from None
        return Response(SubscriptionPlanSerializer(plan).data)
