from django.db.models import Count

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
