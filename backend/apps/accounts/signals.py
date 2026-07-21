from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User, UserPreference


@receiver(post_save, sender=User)
def ensure_user_defaults(sender, instance: User, created: bool, **kwargs):
    if not created:
        return
    UserPreference.objects.get_or_create(user=instance)

    from apps.subscriptions.services import ensure_free_subscription

    ensure_free_subscription(instance)
