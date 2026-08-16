from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("payments", "0001_initial")]
    operations = [
        migrations.AddField(
            model_name="artistpayout",
            name="unique_listeners",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
