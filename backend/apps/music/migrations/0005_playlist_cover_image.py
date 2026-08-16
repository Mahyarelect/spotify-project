from django.db import migrations, models
import apps.music.models


class Migration(migrations.Migration):
    dependencies = [("music", "0004_song_collaborators")]
    operations = [
        migrations.AddField(
            model_name="playlist",
            name="cover_image",
            field=models.ImageField(blank=True, null=True, upload_to=apps.music.models.playlist_cover_upload_path),
        ),
    ]
