from rest_framework.permissions import BasePermission

from .selectors import get_effective_entitlements


class HasPlanFeature(BasePermission):
    message = "Your current subscription does not include this feature."
    code = "plan_feature_required"

    def has_permission(self, request, view):
        feature = getattr(view, "required_plan_feature", None)
        if feature is None:
            raise AssertionError("HasPlanFeature requires view.required_plan_feature")
        return bool(getattr(get_effective_entitlements(request.user), feature, False))
