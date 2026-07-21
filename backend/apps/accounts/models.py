import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower

from .managers import UserManager


def avatar_upload_path(instance, filename: str) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    return f"avatars/{instance.pk}/{uuid.uuid4().hex}.{extension}"


class User(AbstractUser):
    class Role(models.TextChoices):
        LISTENER = "listener", "Listener"
        ARTIST = "artist", "Artist"
        SUPPORT = "support", "Support"
        ADMIN = "admin", "Admin"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"
        UNSPECIFIED = "unspecified", "Unspecified"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    display_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.LISTENER, db_index=True)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=16, choices=Gender.choices, default=Gender.UNSPECIFIED)
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    bio = models.CharField(max_length=300, blank=True)
    artist_verified = models.BooleanField(default=False)
    following = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="followers",
        blank=True,
    )
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        indexes = [models.Index(fields=["role", "is_active"], name="accounts_role_active_idx")]
        constraints = [
            models.UniqueConstraint(Lower("email"), name="accounts_user_email_ci_unique"),
        ]

    def clean(self):
        super().clean()
        self.email = User.objects.normalize_login_email(self.email)
        if self.role in {self.Role.LISTENER, self.Role.ARTIST} and (self.is_staff or self.is_superuser):
            raise ValidationError({"role": "Listener and artist accounts cannot have staff privileges."})
        if self.role == self.Role.SUPPORT and (not self.is_staff or self.is_superuser):
            raise ValidationError({"role": "Support accounts must be staff but not superusers."})
        if self.role == self.Role.ADMIN and not self.is_staff:
            raise ValidationError({"role": "Admin accounts must be staff."})

    def __str__(self) -> str:
        return self.email


class UserPreference(models.Model):
    class Language(models.TextChoices):
        ENGLISH = "en", "English"
        FARSI = "fa", "Farsi"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preferences")
    notify_new_releases = models.BooleanField(default=True)
    notify_subscription_expiry = models.BooleanField(default=True)
    notify_ticket_updates = models.BooleanField(default=False)
    sound_enabled = models.BooleanField(default=True)
    language = models.CharField(max_length=2, choices=Language.choices, default=Language.ENGLISH)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Preferences for {self.user.email}"


class ArtistApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="artist_application",
    )
    artist_name = models.CharField(max_length=150)
    portfolio_url = models.URLField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_artist_applications",
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-submitted_at",)

    def __str__(self) -> str:
        return f"{self.artist_name} ({self.status})"
