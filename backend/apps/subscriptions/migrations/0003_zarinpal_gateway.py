from decimal import Decimal

from django.db import migrations, models


def configure_rial_plans(apps, schema_editor):
    Plan = apps.get_model("subscriptions", "SubscriptionPlan")
    prices = {"free": Decimal("0"), "silver": Decimal("150000"), "gold": Decimal("300000")}
    for code, price in prices.items():
        Plan.objects.filter(code=code).update(monthly_price=price, currency="IRR")


def restore_demo_dollar_plans(apps, schema_editor):
    Plan = apps.get_model("subscriptions", "SubscriptionPlan")
    prices = {"free": Decimal("0"), "silver": Decimal("9.99"), "gold": Decimal("14.99")}
    for code, price in prices.items():
        Plan.objects.filter(code=code).update(monthly_price=price, currency="USD")


class Migration(migrations.Migration):
    dependencies = [("subscriptions", "0002_seed_plans")]
    operations = [
        migrations.AddField(model_name="subscriptionorder", name="gateway_authority", field=models.CharField(blank=True, max_length=64, null=True, unique=True)),
        migrations.AddField(model_name="subscriptionorder", name="gateway_code", field=models.IntegerField(blank=True, null=True)),
        migrations.AddField(model_name="subscriptionorder", name="gateway_message", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="subscriptionorder", name="payment_started_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.RunPython(configure_rial_plans, restore_demo_dollar_plans),
    ]
