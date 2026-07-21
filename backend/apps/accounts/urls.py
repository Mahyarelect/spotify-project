from django.urls import path

from .views.artist_application import ArtistApplicationApproveView, ArtistApplicationRejectView
from .views.auth import (
    ArtistApplicationCreateView,
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RefreshView,
    RegisterView,
)
from .views.profile import CurrentUserView, FollowView, PreferencesView, PublicProfileView


urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/artist-applications/", ArtistApplicationCreateView.as_view(), name="artist-application-create"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/token/refresh/", RefreshView.as_view(), name="token-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("users/me/", CurrentUserView.as_view(), name="current-user"),
    path("users/me/preferences/", PreferencesView.as_view(), name="user-preferences"),
    path("users/<str:username>/", PublicProfileView.as_view(), name="public-profile"),
    path("users/<str:username>/follow/", FollowView.as_view(), name="follow-user"),
    path(
        "admin/artist-applications/<uuid:application_id>/approve/",
        ArtistApplicationApproveView.as_view(),
        name="artist-application-approve",
    ),
    path(
        "admin/artist-applications/<uuid:application_id>/reject/",
        ArtistApplicationRejectView.as_view(),
        name="artist-application-reject",
    ),
]
