from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Case, IntegerField, Value, When
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect
from urllib.parse import urlencode
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.common.permissions import IsAdminRole
from apps.common.domain import DomainError

from .models import SubscriptionOrder, SubscriptionPlan
from .serializers import (
    CurrentSubscriptionResponseSerializer,
    PlanPriceUpdateSerializer,
    SubscriptionOrderCreateSerializer,
    SubscriptionOrderSerializer,
    SubscriptionPlanSerializer,
    serialize_current_subscription,
)
from .services import (
    activate_paid_order,
    create_subscription_order,
    process_zarinpal_callback,
    start_zarinpal_payment,
    update_plan_price,
)


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
            SubscriptionOrder.objects.select_related("plan", "user"),
            pk=order_id,
            user=request.user,
        )
        return Response(self.get_serializer(order).data)


class ZarinpalPaymentStartView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SubscriptionOrderSerializer

    @extend_schema(request=None, responses={200: SubscriptionOrderSerializer})
    def post(self, request, order_id):
        try:
            order = start_zarinpal_payment(order_id=order_id, user=request.user)
        except SubscriptionOrder.DoesNotExist:
            raise Http404 from None
        return Response(self.get_serializer(order).data)


class ZarinpalCallbackView(GenericAPIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()
    serializer_class = SubscriptionOrderSerializer

    @extend_schema(responses={302: None})
    def get(self, request):
        order_id = request.query_params.get("order_id", "")
        authority = request.query_params.get("Authority", "")
        callback_status = request.query_params.get("Status", "")
        result = "failed"
        reference = ""
        try:
            order = process_zarinpal_callback(
                order_id=order_id,
                authority=authority,
                callback_status=callback_status,
            )
            result = {
                SubscriptionOrder.Status.PAID: "success",
                SubscriptionOrder.Status.CANCELLED: "cancelled",
            }.get(order.status, "failed")
            reference = order.provider_reference or ""
        except (SubscriptionOrder.DoesNotExist, ValueError, DjangoValidationError):
            result = "invalid"
        except DomainError:
            result = "failed"
        query = urlencode({"payment": result, "order": order_id, "ref_id": reference})
        return redirect(f"{settings.FRONTEND_ORIGIN.rstrip('/')}/subscription?{query}")


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
