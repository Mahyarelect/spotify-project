from decimal import Decimal

from django.db import migrations


PLANS = (
    {
        "code": "free",
        "display_name": "Free",
        "monthly_price": Decimal("0.00"),
        "currency": "USD",
        "daily_stream_limit": 60,
        "max_playlists": 6,
        "profile_image_allowed": False,
        "download_allowed": False,
        "early_access_allowed": False,
        "statistics_allowed": False,
        "is_active": True,
    },
    {
        "code": "silver",
        "display_name": "Silver",
        "monthly_price": Decimal("9.99"),
        "currency": "USD",
        "daily_stream_limit": None,
        "max_playlists": 100,
        "profile_image_allowed": True,
        "download_allowed": True,
        "early_access_allowed": False,
        "statistics_allowed": False,
        "is_active": True,
    },
    {
        "code": "gold",
        "display_name": "Gold",
        "monthly_price": Decimal("14.99"),
        "currency": "USD",
        "daily_stream_limit": None,
        "max_playlists": None,
        "profile_image_allowed": True,
        "download_allowed": True,
        "early_access_allowed": True,
        "statistics_allowed": True,
        "is_active": True,
    },
)


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("subscriptions", "SubscriptionPlan")
    for plan in PLANS:
        code = plan["code"]
        Plan.objects.update_or_create(code=code, defaults={key: value for key, value in plan.items() if key != "code"})


def unseed_plans(apps, schema_editor):
    Plan = apps.get_model("subscriptions", "SubscriptionPlan")
    Plan.objects.filter(code__in=[plan["code"] for plan in PLANS]).delete()


class Migration(migrations.Migration):
    dependencies = [("subscriptions", "0001_initial")]
    operations = [migrations.RunPython(seed_plans, unseed_plans)]
