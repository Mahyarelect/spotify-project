import secrets

from django.contrib.auth.base_user import BaseUserManager
from django.db import transaction
from django.utils.text import slugify


class UserManager(BaseUserManager):
    use_in_migrations = True

    @staticmethod
    def normalize_login_email(email: str) -> str:
        return BaseUserManager.normalize_email(email).strip().lower()

    def generate_username(self, source: str) -> str:
        base = slugify(source).replace("-", "_")[:120] or "user"
        for _ in range(20):
            candidate = f"{base}_{secrets.token_hex(2)}"
            if not self.filter(username=candidate).exists():
                return candidate
        raise RuntimeError("Unable to generate a unique username")

    @transaction.atomic
    def create_user(self, email: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("An email address is required")
        email = self.normalize_login_email(email)
        role = extra_fields.setdefault("role", self.model.Role.LISTENER)
        source = extra_fields.get("display_name") or email.split("@", 1)[0]
        extra_fields.setdefault("username", self.generate_username(source))

        if role in {self.model.Role.LISTENER, self.model.Role.ARTIST}:
            extra_fields.setdefault("is_staff", False)
            extra_fields.setdefault("is_superuser", False)
        elif role == self.model.Role.SUPPORT:
            extra_fields.setdefault("is_staff", True)
            extra_fields.setdefault("is_superuser", False)
        elif role == self.model.Role.ADMIN:
            extra_fields.setdefault("is_staff", True)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.full_clean(exclude={"password"}, validate_unique=False, validate_constraints=False)
        user.save(using=self._db)
        return user

    def create_support_user(self, email: str, password: str, **extra_fields):
        extra_fields.update(role=self.model.Role.SUPPORT, is_staff=True, is_superuser=False)
        return self.create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.update(role=self.model.Role.ADMIN, is_staff=True, is_superuser=True, is_active=True)
        return self.create_user(email, password, **extra_fields)
