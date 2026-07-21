from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from apps.common.domain import DomainError
from apps.common.events import (
    artist_application_approved,
    artist_application_rejected,
    artist_application_submitted,
)
from apps.subscriptions.services import ensure_free_subscription

from .models import ArtistApplication, User, UserPreference


def _email_exists_error():
    return DomainError(
        "email_exists",
        "An account with this email already exists.",
        status_code=409,
        fields={"email": ["This email is already registered."]},
    )


@transaction.atomic
def register_listener(*, display_name, email, password, birth_date, gender) -> User:
    normalized_email = User.objects.normalize_login_email(email)
    if User.objects.filter(email__iexact=normalized_email).exists():
        raise _email_exists_error()
    try:
        user = User.objects.create_user(
            email=normalized_email,
            password=password,
            display_name=display_name.strip(),
            birth_date=birth_date,
            gender=gender,
            role=User.Role.LISTENER,
        )
    except IntegrityError as error:
        raise _email_exists_error() from error
    UserPreference.objects.get_or_create(user=user)
    ensure_free_subscription(user)
    return user


@transaction.atomic
def submit_artist_application(*, email, password, artist_name, portfolio_url) -> ArtistApplication:
    normalized_email = User.objects.normalize_login_email(email)
    existing_user = User.objects.select_for_update().filter(email__iexact=normalized_email).first()

    if existing_user is not None:
        if existing_user.is_active:
            raise _email_exists_error()
        try:
            application = ArtistApplication.objects.select_for_update().get(user=existing_user)
        except ArtistApplication.DoesNotExist as error:
            raise _email_exists_error() from error
        if application.status != ArtistApplication.Status.REJECTED:
            raise DomainError(
                "artist_application_exists",
                "An artist application with this email is already pending or approved.",
                status_code=409,
                fields={"email": ["An application is already pending or approved."]},
            )
        user = existing_user
        user.display_name = artist_name.strip()
        user.role = User.Role.ARTIST
        user.is_active = False
        user.is_staff = False
        user.is_superuser = False
        user.artist_verified = False
        user.set_password(password)
        user.save()
        application.artist_name = artist_name.strip()
        application.portfolio_url = portfolio_url
        application.status = ArtistApplication.Status.PENDING
        application.rejection_reason = ""
        application.reviewed_by = None
        application.reviewed_at = None
        application.submitted_at = timezone.now()
        application.save()
    else:
        user = User.objects.create_user(
            email=normalized_email,
            password=password,
            display_name=artist_name.strip(),
            role=User.Role.ARTIST,
            is_active=False,
        )
        UserPreference.objects.get_or_create(user=user)
        ensure_free_subscription(user)
        application = ArtistApplication.objects.create(
            user=user,
            artist_name=artist_name.strip(),
            portfolio_url=portfolio_url,
        )

    transaction.on_commit(
        lambda: artist_application_submitted.send_robust(
            sender=ArtistApplication,
            application_id=application.id,
        )
    )
    return application


def _validate_reviewer(reviewer: User) -> None:
    if not (
        reviewer.is_active
        and reviewer.is_staff
        and reviewer.role in {User.Role.SUPPORT, User.Role.ADMIN}
    ):
        raise DomainError("review_forbidden", "You cannot review artist applications.", status_code=403)


@transaction.atomic
def approve_artist_application(*, application_id, reviewer: User) -> ArtistApplication:
    _validate_reviewer(reviewer)
    application = (
        ArtistApplication.objects.select_for_update()
        .select_related("user")
        .get(pk=application_id)
    )
    if application.status == ArtistApplication.Status.APPROVED:
        return application
    if application.status != ArtistApplication.Status.PENDING:
        raise DomainError("artist_application_already_reviewed", "This application was already reviewed.", status_code=409)

    application.status = ArtistApplication.Status.APPROVED
    application.rejection_reason = ""
    application.reviewed_by = reviewer
    application.reviewed_at = timezone.now()
    application.save()
    user = application.user
    user.is_active = True
    user.artist_verified = True
    user.save(update_fields=("is_active", "artist_verified", "updated_at"))
    transaction.on_commit(
        lambda: artist_application_approved.send_robust(sender=ArtistApplication, application_id=application.id)
    )
    return application


@transaction.atomic
def reject_artist_application(*, application_id, reviewer: User, reason: str) -> ArtistApplication:
    _validate_reviewer(reviewer)
    reason = reason.strip()
    if not reason:
        raise DomainError(
            "rejection_reason_required",
            "A rejection reason is required.",
            fields={"reason": ["This field is required."]},
        )
    application = (
        ArtistApplication.objects.select_for_update()
        .select_related("user")
        .get(pk=application_id)
    )
    if application.status == ArtistApplication.Status.REJECTED:
        return application
    if application.status != ArtistApplication.Status.PENDING:
        raise DomainError("artist_application_already_reviewed", "This application was already reviewed.", status_code=409)

    application.status = ArtistApplication.Status.REJECTED
    application.rejection_reason = reason
    application.reviewed_by = reviewer
    application.reviewed_at = timezone.now()
    application.save()
    user = application.user
    user.is_active = False
    user.artist_verified = False
    user.save(update_fields=("is_active", "artist_verified", "updated_at"))
    transaction.on_commit(
        lambda: artist_application_rejected.send_robust(sender=ArtistApplication, application_id=application.id)
    )
    return application


def send_password_reset(*, user: User, frontend_origin: str) -> None:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = f"{frontend_origin.rstrip('/')}/reset-password?uid={uid}&token={token}"
    send_mail(
        "Reset your Music App password",
        f"Use this link to reset your password: {reset_url}",
        None,
        [user.email],
    )
