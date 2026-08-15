from django.urls import path
from .views import ArtistPayoutListView, GeneratePayoutsView, PayoutStatusView

urlpatterns = [
    path("artist/payouts/", ArtistPayoutListView.as_view(), name="artist-payout-list"),
    path("admin/payouts/generate/", GeneratePayoutsView.as_view(), name="payout-generate"),
    path("admin/payouts/<uuid:pk>/status/", PayoutStatusView.as_view(), name="payout-status"),
]

