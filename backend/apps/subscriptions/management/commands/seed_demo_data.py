from datetime import date, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import ArtistApplication, User, UserPreference
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from apps.subscriptions.services import ensure_free_subscription


DEMO_PASSWORD = "Password123!"
DEMO_USERS = (
    ("mahyar@example.com", "Mahyar", User.Role.LISTENER, SubscriptionPlan.Code.FREE),
    ("ali@example.com", "Ali", User.Role.ARTIST, SubscriptionPlan.Code.SILVER),
    ("hasan@example.com", "Hasan", User.Role.ADMIN, SubscriptionPlan.Code.GOLD),
    ("parsa@example.com", "Parsa", User.Role.SUPPORT, SubscriptionPlan.Code.FREE),
)


class Command(BaseCommand):
    help = "Create idempotent development-only demo accounts."

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo_data is disabled when DJANGO_DEBUG is false")

        for email, display_name, role, plan_code in DEMO_USERS:
            defaults = {
                "display_name": display_name,
                "role": role,
                "birth_date": date(2000, 1, 1),
                "is_active": True,
                "is_staff": role in {User.Role.SUPPORT, User.Role.ADMIN},
                "is_superuser": role == User.Role.ADMIN,
                "artist_verified": role == User.Role.ARTIST,
            }
            user = User.objects.filter(email=email).first()
            if user is None:
                user = User.objects.create_user(email=email, password=DEMO_PASSWORD, **defaults)
            else:
                for field, value in defaults.items():
                    setattr(user, field, value)
                user.set_password(DEMO_PASSWORD)
                user.save()

            UserPreference.objects.get_or_create(user=user)
            subscription = ensure_free_subscription(user)
            plan = SubscriptionPlan.objects.get(code=plan_code)
            subscription.plan = plan
            subscription.status = UserSubscription.Status.ACTIVE
            subscription.expires_at = (
                None if plan.code == SubscriptionPlan.Code.FREE else timezone.now() + timedelta(days=365)
            )
            subscription.save()

            if role == User.Role.ARTIST:
                ArtistApplication.objects.update_or_create(
                    user=user,
                    defaults={
                        "artist_name": display_name,
                        "portfolio_url": "https://example.com/ali",
                        "status": ArtistApplication.Status.APPROVED,
                        "reviewed_at": timezone.now(),
                    },
                )

        self.stdout.write(self.style.SUCCESS("Demo users are ready."))
