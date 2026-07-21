# Music App

A React 19 music application with a Django REST Framework backend for authentication, profiles, preferences, artist review, and subscriptions. PostgreSQL is the source of truth for users, JWT sessions, plan prices, entitlements, and orders. The remaining Phase 1 music/player demo data stays browser-local until its owning modules are migrated.

## Prerequisites

- Node.js 22 or newer
- Python 3.12
- PostgreSQL 15 or newer

## Backend setup

```bash
cd backend
python -m venv ../.venv
../.venv/Scripts/python -m pip install -r requirements.txt
copy .env.example .env
../.venv/Scripts/python manage.py migrate
../.venv/Scripts/python manage.py seed_demo_data
../.venv/Scripts/python manage.py runserver
```

On macOS/Linux, activate the virtual environment or use `../.venv/bin/python`, and use `cp` instead of `copy`. Update `backend/.env` with a real PostgreSQL `DATABASE_URL` and a development secret before migrating.

The API runs at `http://127.0.0.1:8000`. In development, Swagger UI is at [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/) and the health endpoint is `GET /api/v1/health/`.

## Frontend setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

`VITE_API_BASE_URL` defaults to `/api/v1`; Vite proxies `/api` to the local Django server. Access and refresh tokens are stored in `sessionStorage`, never in URLs or persistent local storage.

## Development accounts

Run `python manage.py seed_demo_data` in `DEBUG` mode. It is idempotent and creates:

| Email | Password | Role | Demo plan |
|---|---|---|---|
| `mahyar@example.com` | `Password123!` | Listener | Free |
| `ali@example.com` | `Password123!` | Approved artist | Silver |
| `hasan@example.com` | `Password123!` | Admin | Gold |
| `parsa@example.com` | `Password123!` | Support | Free |

The command is disabled when `DJANGO_DEBUG=false`. These credentials are development-only.

## Verification

```bash
# Backend (from backend/ with DATABASE_URL configured)
pytest
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py spectacular --file openapi.yaml --validate

# Frontend (from the repository root)
npm run test:run
npm run lint
npm run build
```

Backend tests intentionally require PostgreSQL; SQLite is unsupported. The frontend API tests mock HTTP at the service boundary, while Django tests verify database state and permissions.

## Source-of-truth boundaries

- Django/PostgreSQL owns accounts, credentials, roles, artist applications, follows, preferences, avatars, subscription plans, entitlements, and orders.
- The frontend renders server-provided plan prices, currencies, durations, and limits. Client guards are UX only.
- Music catalog, playback simulation, playlists, notifications, tickets, and audit demo data remain local Phase 1 modules. They receive effective entitlement values from the authenticated backend user and must not infer limits from a plan name.
- Public and private profile DTOs are separate; public responses never include email, demographics, preferences, or subscription expiry.

## Phase 2 implementation notes

- Each user owns one preference record and one current entitlement, may create many subscription orders, and may follow other users. Artist applications belong to a user and record their reviewer; subscription orders snapshot their selected plan's price and currency before activation.
- State-changing workflows live in backend services so artist review and payment confirmation stay transactional and idempotent. Serializers validate and shape data, selectors resolve effective entitlements, and permission classes enforce roles and plan features at the API boundary.
- UUID identifiers, separate public/private DTOs, server-generated usernames, PostgreSQL constraints, and server-side price calculations were chosen to keep client input outside authorization and billing decisions.
- Codex assisted with the Phase 2 implementation and documentation. Its output was validated with the clean-database workflow and automated checks listed above; production deployment still requires the normal security and code-review process.

## Production notes

Set `DJANGO_DEBUG=false`, use a strong `DJANGO_SECRET_KEY`, restrict `DJANGO_ALLOWED_HOSTS` and `FRONTEND_ORIGIN`, serve over HTTPS, configure durable email/payment providers, and tune the authentication throttle rates in `backend/.env`. The mock order-confirmation endpoint is unavailable outside debug mode.
