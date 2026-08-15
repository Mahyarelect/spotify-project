import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import apps.listening.models
import uuid


class Migration(migrations.Migration):
    initial = True
    dependencies = [("music", "0003_recentlyplayed"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="ListeningGroup",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("invite_code", models.CharField(default=apps.listening.models.invite_code, editable=False, max_length=16, unique=True)),
                ("is_playing", models.BooleanField(default=False)),
                ("position_seconds", models.FloatField(default=0)),
                ("state_changed_at", models.DateTimeField(auto_now_add=True)),
                ("revision", models.PositiveBigIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="listening_groups", to=settings.AUTH_USER_MODEL)),
                ("current_song", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="music.song")),
            ],
        ),
        migrations.CreateModel(
            name="ListeningMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("connection_count", models.PositiveIntegerField(default=0)),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="members", to="listening.listeninggroup")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="listening_memberships", to=settings.AUTH_USER_MODEL)),
            ],
            options={"constraints": [models.UniqueConstraint(fields=("group", "user"), name="listening_group_user_unique")]},
        ),
    ]
