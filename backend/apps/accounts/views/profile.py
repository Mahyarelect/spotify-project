from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from ..selectors import get_current_user
from ..serializers.profile import CurrentUserSerializer


class CurrentUserView(RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CurrentUserSerializer

    def get_object(self):
        return get_current_user(self.request.user.id)
