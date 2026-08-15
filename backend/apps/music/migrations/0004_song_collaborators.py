from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("music", "0003_recentlyplayed")]

    operations = [
        migrations.AddField(
            model_name="song",
            name="collaborators",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
