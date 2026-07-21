# Music App backend

Django REST Framework API backed exclusively by PostgreSQL. It owns authentication, profiles, preferences, follows, artist applications, subscription plans, entitlements, and server-priced orders.

## Local setup

1. Create a PostgreSQL database and user matching `DATABASE_URL`.
2. Copy `.env.example` to `.env` and replace the development secret.
3. Create a Python 3.12 virtual environment and install `requirements.txt`.
4. Run `python manage.py migrate`.
5. In debug mode, run `python manage.py seed_demo_data` (safe to repeat).
6. Run `python manage.py runserver`.

Health is `GET /api/v1/health/`. In debug mode, OpenAPI documentation is available at `/api/docs/` and `/api/redoc/`.

## Entitlement integration contract

Use the helpers in `apps.subscriptions.services`; never authorize a feature from a role label or frontend plan name.

- Streams: call `get_daily_stream_limit(user)`, count today's qualifying streams, reject at the limit with HTTP 403 `daily_stream_limit_reached`, and check/increment transactionally.
- Playlists: call `get_playlist_limit(user)`, count owned playlists, reject at the limit with HTTP 403 `playlist_limit_reached`, and create transactionally.
- Downloads: call `require_feature(user, "download_allowed")` before returning a file or signed URL.
- Early access: filter restricted releases server-side unless `require_feature(user, "early_access_allowed")` succeeds. Never send records and only hide them in React.
- Statistics: protect statistics endpoints with `require_feature(user, "statistics_allowed")` and aggregate server-side.
- Avatar uploads: `set_avatar` checks the effective `profile_image_allowed` entitlement and validates content through Pillow.
- Artist review: use `approve_artist_application` and `reject_artist_application`; do not toggle activation or verification in serializers.

Effective entitlements automatically fall back to Free for missing, cancelled, or expired paid subscriptions. Client-side guards are presentation only.

## API and security behavior

- JWT refresh tokens rotate and old refresh tokens are blacklisted.
- Registration, login, and password-reset requests use configurable scoped throttles.
- CORS permits only `FRONTEND_ORIGIN`.
- Public and private profile serializers are distinct.
- The development mock order confirmation requires authentication, ownership, and `DEBUG=true`.
- Prices use `Decimal`; order price and currency are snapshotted; activation is transactional and idempotent.

For production, terminate HTTPS at the proxy, use a managed secret and PostgreSQL service, configure a real email/payment provider, validate provider callbacks, and tune throttle rates.

## Verification

```bash
pytest
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py spectacular --file openapi.yaml --validate
```

Automated tests intentionally target PostgreSQL. SQLite is not a supported application or test database.
