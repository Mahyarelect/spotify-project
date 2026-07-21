from datetime import date

import factory
from factory.django import DjangoModelFactory

from apps.accounts.models import ArtistApplication, User, UserPreference


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda number: f"user{number}@example.com")
    password = factory.PostGenerationMethodCall("set_password", "Password123!")
    display_name = factory.Faker("name")
    birth_date = date(2000, 1, 1)


class UserPreferenceFactory(DjangoModelFactory):
    class Meta:
        model = UserPreference

    user = factory.SubFactory(UserFactory)


class ArtistApplicationFactory(DjangoModelFactory):
    class Meta:
        model = ArtistApplication

    user = factory.SubFactory(UserFactory, role=User.Role.ARTIST, is_active=False)
    artist_name = factory.Faker("name")
    portfolio_url = factory.Faker("url")
