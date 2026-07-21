from django.shortcuts import get_object_or_404
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from ..models import User, UserPreference
from ..selectors import get_current_user, get_public_profile
from ..serializers.profile import (
    AccountDeleteSerializer,
    CurrentUserSerializer,
    ProfileUpdateSerializer,
    PublicProfileSerializer,
    UserPreferenceSerializer,
)
from ..services import delete_own_account, follow_user, set_avatar, unfollow_user, update_own_profile


class CurrentUserView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    serializer_class = CurrentUserSerializer

    def get(self, request):
        user = get_current_user(request.user.id)
        return Response(self.get_serializer(user).data)

    @extend_schema(request=ProfileUpdateSerializer, responses={200: CurrentUserSerializer})
    @transaction.atomic
    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changes = dict(serializer.validated_data)
        avatar = changes.pop("avatar", None)
        user = request.user
        if changes:
            update_own_profile(user=user, changes=changes)
        if avatar is not None:
            set_avatar(user=user, avatar=avatar)
        current_user = get_current_user(user.id)
        return Response(self.get_serializer(current_user).data)

    @extend_schema(request=AccountDeleteSerializer, responses={204: None})
    def delete(self, request):
        serializer = AccountDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delete_own_account(
            user=request.user,
            current_password=serializer.validated_data["current_password"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicProfileView(RetrieveAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PublicProfileSerializer

    def get_object(self):
        try:
            return get_public_profile(self.kwargs["username"], self.request.user)
        except User.DoesNotExist:
            return get_object_or_404(User, username=self.kwargs["username"])


class FollowView(GenericAPIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(request=None, responses={200: PublicProfileSerializer})
    def post(self, request, username):
        target = get_object_or_404(User, username=username, is_active=True)
        follow_user(follower=request.user, target=target)
        profile = get_public_profile(username, request.user)
        return Response(PublicProfileSerializer(profile, context={"request": request}).data)

    @extend_schema(request=None, responses={200: PublicProfileSerializer})
    def delete(self, request, username):
        target = get_object_or_404(User, username=username, is_active=True)
        unfollow_user(follower=request.user, target=target)
        profile = get_public_profile(username, request.user)
        return Response(PublicProfileSerializer(profile, context={"request": request}).data)


class PreferencesView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserPreferenceSerializer

    def get_object(self):
        return request_preferences(self.request.user)

    def get(self, request):
        return Response(self.get_serializer(self.get_object()).data)

    def patch(self, request):
        preferences = self.get_object()
        serializer = self.get_serializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


def request_preferences(user):
    preferences, _ = UserPreference.objects.get_or_create(user=user)
    return preferences
