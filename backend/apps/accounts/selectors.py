from django.db.models import (
    Case,
    CharField,
    Count,
    Exists,
    F,
    IntegerField,
    OuterRef,
    Q,
    Value,
    When,
)
from django.db.models.functions import Lower
from django.utils import timezone

from apps.subscriptions.models import SubscriptionPlan, UserSubscription

from .models import User


def get_user_by_email_ci(email: str):
    return User.objects.filter(email__iexact=email.strip()).first()


def get_current_user(user_id):
    return (
        User.objects.select_related("preferences", "subscription__plan")
        .annotate(followers_count_value=Count("followers", distinct=True))
        .annotate(following_count_value=Count("following", distinct=True))
        .get(pk=user_id)
    )


def get_public_profile(username: str, viewer=None):
    user = (
        User.objects.annotate(followers_count_value=Count("followers", distinct=True))
        .annotate(following_count_value=Count("following", distinct=True))
        .get(username=username)
    )
    user.is_following_value = bool(
        viewer
        and viewer.is_authenticated
        and viewer.following.filter(pk=user.pk).exists()
    )
    return user


def search_users(*, query: str, viewer):
    following_through = User.following.through
    return (
        User.objects.filter(is_active=True)
        .exclude(pk=viewer.pk)
        .filter(Q(username__icontains=query) | Q(display_name__icontains=query))
        .annotate(
            followers_count_value=Count("followers", distinct=True),
            following_count_value=Count("following", distinct=True),
            is_following_value=Exists(
                following_through.objects.filter(
                    from_user_id=viewer.pk,
                    to_user_id=OuterRef("pk"),
                )
            ),
            plan_name_value=Case(
                When(
                    subscription__status=UserSubscription.Status.ACTIVE,
                    subscription__expires_at__gt=timezone.now(),
                    then=F("subscription__plan__code"),
                ),
                default=Value(SubscriptionPlan.Code.FREE),
                output_field=CharField(),
            ),
            search_rank=Case(
                When(username__iexact=query, then=Value(0)),
                When(username__istartswith=query, then=Value(1)),
                When(display_name__istartswith=query, then=Value(2)),
                default=Value(3),
                output_field=IntegerField(),
            ),
            username_order=Lower("username"),
        )
        .order_by("search_rank", "username_order", "pk")
    )
