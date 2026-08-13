import shutil
import uuid
from datetime import date, timedelta
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.music.models import Album, Playlist, PlaylistSong, Song

SAMPLES_DIR = Path(settings.BASE_DIR) / "music_samples"

ARTISTS = [
    {
        "email": "kevin@incompetech.com",
        "username": "kevinmacleod",
        "display_name": "Kevin MacLeod",
        "bio": "Composer and musician, known for royalty-free music under Creative Commons license.",
    },
    {
        "email": "jason@audionautix.com",
        "username": "jasonshaw",
        "display_name": "Jason Shaw",
        "bio": "Electronic music producer creating royalty-free tracks for creators worldwide.",
    },
    {
        "email": "echo@synthwave.io",
        "username": "echosynth",
        "display_name": "Echo Synth",
        "bio": "Synthwave and electronic artist blending retro and modern sounds.",
    },
]

ALBUMS = [
    {
        "title": "Bright Days",
        "artist_username": "kevinmacleod",
        "genre": "Pop",
        "cover_color": "#FFD700",
        "release_date": date(2024, 3, 15),
        "is_early_access": False,
    },
    {
        "title": "Midnight Groove",
        "artist_username": "kevinmacleod",
        "genre": "Jazz",
        "cover_color": "#1a1a2e",
        "release_date": date(2024, 6, 1),
        "is_early_access": False,
    },
    {
        "title": "Digital Dreams",
        "artist_username": "jasonshaw",
        "genre": "Electronic",
        "cover_color": "#00d4ff",
        "release_date": date(2024, 1, 20),
        "is_early_access": False,
    },
    {
        "title": "Chill Vibes",
        "artist_username": "echosynth",
        "genre": "Ambient",
        "cover_color": "#9b59b6",
        "release_date": date(2024, 8, 10),
        "is_early_access": True,
    },
]

SONGS = [
    {
        "title": "Carefree",
        "filename": "Carefree.mp3",
        "album_title": "Bright Days",
        "artist_username": "kevinmacleod",
        "duration_sec": 205,
        "cover_color": "#FFD700",
        "genre": "Pop",
        "track_number": 1,
        "release_year": 2024,
    },
    {
        "title": "Happy Boy Theme",
        "filename": "Happy Boy Theme.mp3",
        "album_title": "Bright Days",
        "artist_username": "kevinmacleod",
        "duration_sec": 37,
        "cover_color": "#FF6B6B",
        "genre": "Pop",
        "track_number": 2,
        "release_year": 2024,
    },
    {
        "title": "Fluffing a Duck",
        "filename": "Fluffing a Duck.mp3",
        "album_title": "Bright Days",
        "artist_username": "kevinmacleod",
        "duration_sec": 67,
        "cover_color": "#FFE66D",
        "genre": "Pop",
        "track_number": 3,
        "release_year": 2024,
    },
    {
        "title": "Groove Grove",
        "filename": "Groove Grove.mp3",
        "album_title": "Midnight Groove",
        "artist_username": "kevinmacleod",
        "duration_sec": 206,
        "cover_color": "#2d3436",
        "genre": "Jazz",
        "track_number": 1,
        "release_year": 2024,
    },
    {
        "title": "Airport Lounge",
        "filename": "Airport Lounge.mp3",
        "album_title": "Midnight Groove",
        "artist_username": "kevinmacleod",
        "duration_sec": 308,
        "cover_color": "#636e72",
        "genre": "Jazz",
        "track_number": 2,
        "release_year": 2024,
    },
    {
        "title": "Monkeys Spinning Monkeys",
        "filename": "Monkeys Spinning Monkeys.mp3",
        "album_title": "Digital Dreams",
        "artist_username": "jasonshaw",
        "duration_sec": 125,
        "cover_color": "#00cec9",
        "genre": "Electronic",
        "track_number": 1,
        "release_year": 2024,
    },
    {
        "title": "Scheming Weasel",
        "filename": "Scheming Weasel faster.mp3",
        "album_title": "Digital Dreams",
        "artist_username": "jasonshaw",
        "duration_sec": 89,
        "cover_color": "#0984e3",
        "genre": "Electronic",
        "track_number": 2,
        "release_year": 2024,
    },
    {
        "title": "Local Forecast",
        "filename": "Local Forecast.mp3",
        "album_title": "Digital Dreams",
        "artist_username": "jasonshaw",
        "duration_sec": 165,
        "cover_color": "#6c5ce7",
        "genre": "Electronic",
        "track_number": 3,
        "release_year": 2024,
    },
    {
        "title": "Wallpaper",
        "filename": "Wallpaper.mp3",
        "album_title": "Chill Vibes",
        "artist_username": "echosynth",
        "duration_sec": 215,
        "cover_color": "#a29bfe",
        "genre": "Ambient",
        "track_number": 1,
        "release_year": 2024,
    },
    {
        "title": "Cipher",
        "filename": "Cipher2.mp3",
        "album_title": "Chill Vibes",
        "artist_username": "echosynth",
        "duration_sec": 231,
        "cover_color": "#fd79a8",
        "genre": "Ambient",
        "track_number": 2,
        "release_year": 2024,
    },
]

PLAYLISTS = [
    {
        "title": "Feel Good Mix",
        "description": "Upbeat and happy tracks to brighten your day",
        "cover_color": "#FFD700",
        "song_titles": ["Carefree", "Happy Boy Theme", "Fluffing a Duck", "Local Forecast"],
    },
    {
        "title": "Late Night Chill",
        "description": "Smooth and relaxing vibes for late night listening",
        "cover_color": "#1a1a2e",
        "song_titles": ["Airport Lounge", "Wallpaper", "Cipher", "Groove Grove"],
    },
    {
        "title": "Electronic Essentials",
        "description": "Best electronic tracks for focus and energy",
        "cover_color": "#00d4ff",
        "song_titles": ["Monkeys Spinning Monkeys", "Scheming Weasel", "Local Forecast", "Cipher"],
    },
]


class Command(BaseCommand):
    help = "Seed the database with sample music data and audio files"

    def handle(self, *args, **options):
        self.stdout.write("Seeding music data...")

        if not SAMPLES_DIR.exists():
            self.stderr.write(self.style.ERROR(f"Music samples directory not found: {SAMPLES_DIR}"))
            return

        # Create artist users
        artists = {}
        for data in ARTISTS:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username": data["username"],
                    "display_name": data["display_name"],
                    "bio": data["bio"],
                    "role": User.Role.ARTIST,
                    "artist_verified": True,
                    "birth_date": date(1990, 1, 1),
                },
            )
            if created:
                user.set_password("MusicPass123!")
                user.save()
                self.stdout.write(f"  Created artist: {user.display_name}")
            else:
                self.stdout.write(f"  Artist exists: {user.display_name}")
            artists[data["username"]] = user

        # Create albums
        albums = {}
        for data in ALBUMS:
            artist = artists[data["artist_username"]]
            album, created = Album.objects.get_or_create(
                artist=artist,
                title=data["title"],
                defaults={
                    "cover_color": data["cover_color"],
                    "release_date": data["release_date"],
                    "is_early_access": data["is_early_access"],
                    "genre": data["genre"],
                },
            )
            albums[data["title"]] = album
            if created:
                self.stdout.write(f"  Created album: {album.title}")
            else:
                self.stdout.write(f"  Album exists: {album.title}")

        # Create songs with audio files
        songs = {}
        for data in SONGS:
            artist = artists[data["artist_username"]]
            album = albums[data["album_title"]]
            audio_path = SAMPLES_DIR / data["filename"]

            if not audio_path.exists():
                self.stderr.write(self.style.WARNING(f"  Audio file not found: {audio_path}"))
                continue

            song, created = Song.objects.get_or_create(
                artist=artist,
                title=data["title"],
                defaults={
                    "album": album,
                    "duration_sec": data["duration_sec"],
                    "cover_color": data["cover_color"],
                    "genre": data["genre"],
                    "track_number": data["track_number"],
                    "release_year": data["release_year"],
                    "play_count": 0,
                },
            )

            if created or not song.audio_file:
                # Copy audio file to media directory
                ext = audio_path.suffix
                audio_content = ContentFile(audio_path.read_bytes())
                audio_content.name = f"{uuid.uuid4().hex}{ext}"
                song.audio_file.save(audio_content.name, audio_content, save=True)
                self.stdout.write(f"  Created song: {song.title} (with audio)")
            else:
                self.stdout.write(f"  Song exists: {song.title}")

            songs[data["title"]] = song

        # Create playlists
        for data in PLAYLISTS:
            # Use first artist as playlist creator
            creator = artists[ARTISTS[0]["username"]]
            playlist, created = Playlist.objects.get_or_create(
                created_by=creator,
                title=data["title"],
                defaults={
                    "cover_color": data["cover_color"],
                    "description": data["description"],
                },
            )

            if created:
                for position, song_title in enumerate(data["song_titles"], 1):
                    if song_title in songs:
                        PlaylistSong.objects.create(
                            playlist=playlist,
                            song=songs[song_title],
                            position=position,
                        )
                self.stdout.write(f"  Created playlist: {playlist.title}")
            else:
                self.stdout.write(f"  Playlist exists: {playlist.title}")

        # Print summary
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Music seed complete!"))
        self.stdout.write(f"  Artists: {User.objects.filter(role=User.Role.ARTIST).count()}")
        self.stdout.write(f"  Albums: {Album.objects.count()}")
        self.stdout.write(f"  Songs: {Song.objects.count()}")
        self.stdout.write(f"  Songs with audio: {Song.objects.exclude(audio_file='').count()}")
        self.stdout.write(f"  Playlists: {Playlist.objects.count()}")
        self.stdout.write("")
        self.stdout.write("Artist login credentials:")
        for data in ARTISTS:
            self.stdout.write(f"  {data['display_name']}: {data['email']} / MusicPass123!")
