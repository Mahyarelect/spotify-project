from django.dispatch import Signal


artist_application_submitted = Signal()
artist_application_approved = Signal()
artist_application_rejected = Signal()
subscription_activated = Signal()
