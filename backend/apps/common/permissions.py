from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import User


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", obj)
        return owner == request.user


class IsSelfOrReadOnlyPublicProfile(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in SAFE_METHODS or obj == request.user


class IsSupportOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user.is_authenticated
            and user.is_staff
            and user.role in {User.Role.SUPPORT, User.Role.ADMIN}
        )


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user.is_authenticated and user.is_staff and user.role == User.Role.ADMIN)


class AllowedRoles(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role in getattr(view, "allowed_roles", set())
        )
