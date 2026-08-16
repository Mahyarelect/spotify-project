# Spotify Project

A full-stack music streaming application built with React, TypeScript, Django REST Framework, PostgreSQL, Redis, Django Channels, and Nginx. It includes a server-backed catalog and player, subscriptions with ZarinPal sandbox checkout, artist workflows, support and administration tools, notifications, and real-time group listening.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick start with Docker](#quick-start-with-docker)
- [Demo data and accounts](#demo-data-and-accounts)
- [Run locally without Docker](#run-locally-without-docker)
- [Database operations](#database-operations)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [API and application URLs](#api-and-application-urls)
- [Payments and group listening](#payments-and-group-listening)
- [PWA behavior](#pwa-behavior)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Production checklist](#production-checklist)

## Features

- Listener registration, artist applications, JWT login/refresh/logout, password reset, profiles, user search, and follows
- Listener, verified artist, support, and admin roles with backend permissions
- PostgreSQL-backed artists, albums, songs, collaborators, playlists, streams, and recently played history
- Real audio and cover uploads, playback, queue controls, downloads, and artist statistics
- Backend enforcement of streaming, playlist, Gold early-access, and statistics entitlements
- Free, Silver, and Gold plans with server-authoritative pricing and expiry
- Idempotent subscription orders and ZarinPal sandbox checkout/verification
- Artist dashboards, monthly payouts, revenue reporting, and admin financial audit
- Support tickets/messages and persistent notifications
- English and Persian interfaces
- Temporary invite-link listening rooms with synchronized song selection, play, pause, resume, seek, progress, and presence
- Installable PWA shell without caching private API responses or media

Subscription purchasing is available to **listener accounts only**. Support and admin permissions are distinct.

## Architecture

```text
Browser
  |
  v
Nginx / React PWA
  |-- /api and /admin ------> Django REST Framework / Daphne
  |-- /ws ------------------> Django Channels / Daphne
  |-- /media ---------------> persistent media volume
  `-- /static --------------> collected static volume
                                  |              |
                                  v              v
                             PostgreSQL        Redis
                             durable data      realtime events
```

PostgreSQL owns accounts, subscriptions, orders, music, playlists, streams, artist profiles, tickets, notifications, payouts, and listening-room state. Redis transports ephemeral Channels events. Audio and images live in persistent media storage. See [call-graph.md](call-graph.md) for dependency flow.

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Forms | React Hook Form, Zod |
| Frontend tests | Vitest, Testing Library |
| Backend | Python 3.12, Django 5.2, Django REST Framework |
| Realtime | Django Channels, Daphne, Redis |
| Authentication | Simple JWT with refresh rotation/blacklisting |
| Database | PostgreSQL 16 in Docker; PostgreSQL 15+ locally |
| API documentation | drf-spectacular / OpenAPI |
| Deployment | Docker Compose and Nginx |

## Quick start with Docker

Docker is recommended because it runs PostgreSQL, Redis, Django, Nginx, and the React production build together.

### Requirements

- Docker Desktop with Compose v2
- Git
- Port `8080`, or another available port

### Configure and start

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

For demo accounts, edit `.env`:

```dotenv
DJANGO_DEBUG=true
SEED_DEMO_DATA=true
```

Start the stack:

```bash
docker compose up -d --build
docker compose ps
```

Open:

- App: <http://localhost:8080>
- Health: <http://localhost:8080/api/v1/health/>
- Admin: <http://localhost:8080/admin/>
- Swagger when debug is enabled: <http://localhost:8080/api/docs/>

The backend automatically runs migrations and `collectstatic`. With `SEED_DEMO_DATA=true`, it also seeds accounts idempotently.

### Use port 8081 if 8080 is occupied

Set all three matching values in `.env`:

```dotenv
APP_PORT=8081
FRONTEND_ORIGIN=http://localhost:8081
ZARINPAL_CALLBACK_URL=http://localhost:8081/api/v1/subscriptions/zarinpal/callback/
```

Then run `docker compose up -d --build` and open <http://localhost:8081>. Changing only `APP_PORT` can break CORS and payment callbacks.

### Docker lifecycle

```bash
docker compose logs -f backend frontend       # follow logs
docker compose logs --tail 200 backend        # recent backend logs
docker compose restart                        # restart
docker compose up -d --build                  # rebuild and recreate
docker compose down                           # stop; preserve data
docker compose down --volumes                 # DANGER: delete DB/media volumes
```

## Demo data and accounts

The development seed requires `DJANGO_DEBUG=true` and is safe to repeat:

```bash
docker compose exec backend python manage.py seed_demo_data
```

| Email | Password | Role | Plan |
|---|---|---|---|
| `mahyar@example.com` | `Password123!` | Listener | Free |
| `ali@example.com` | `Password123!` | Verified artist | Silver |
| `parsa@example.com` | `Password123!` | Support | Free |
| `hasan@example.com` | `Password123!` | Admin/superuser | Gold |

Use Mahyar to test subscription purchasing because only listeners may create orders.

### Seed real sample music

The music seed expects MP3 files in `backend/music_samples/` with the exact filenames listed in `backend/apps/music/management/commands/seed_music.py`. After adding them:

```bash
docker compose build backend
docker compose up -d backend frontend
docker compose exec backend python manage.py seed_music
```

This idempotently creates sample artists, albums, songs with audio, and playlists. Seeded music artists use password `MusicPass123!`.

## Run locally without Docker

### Requirements

- Node.js 22+
- Python 3.12
- PostgreSQL 15+
- Redis 7+ recommended for group listening

### Create PostgreSQL database

In `psql` as an administrator:

```sql
CREATE USER spotify WITH PASSWORD 'spotify';
CREATE DATABASE spotify OWNER spotify;
GRANT ALL PRIVILEGES ON DATABASE spotify TO spotify;
```

Or:

```bash
psql -U postgres -c "CREATE USER spotify WITH PASSWORD 'spotify';"
psql -U postgres -c "CREATE DATABASE spotify OWNER spotify;"
```

If they already exist, update credentials/ownership instead of recreating them.

### Backend on Windows PowerShell

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
.\.venv\Scripts\python.exe backend\manage.py migrate
.\.venv\Scripts\python.exe backend\manage.py seed_demo_data
.\.venv\Scripts\python.exe backend\manage.py runserver 9000
```

### Backend on macOS/Linux

```bash
python3.12 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
.venv/bin/python backend/manage.py migrate
.venv/bin/python backend/manage.py seed_demo_data
.venv/bin/python backend/manage.py runserver 9000
```

Port `9000` matches the proxy in `vite.config.ts`. Configure Redis in `backend/.env`:

```dotenv
REDIS_URL=redis://127.0.0.1:6379/0
```

Start Redis locally or use Compose:

```bash
docker compose up -d redis
```

Without `REDIS_URL`, Django uses an in-memory channel layer suitable only for one backend process. To run the ASGI server explicitly:

```powershell
cd backend
..\.venv\Scripts\daphne.exe -b 127.0.0.1 -p 9000 config.asgi:application
```

Use `../.venv/bin/daphne` on macOS/Linux.

### Frontend

In another terminal at the repository root:

```bash
npm ci
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to Django on port `9000`.

Create a manual superuser with:

```bash
python backend/manage.py createsuperuser
```

Use the virtual-environment Python path where applicable.

## Database operations

### Migrations

```bash
docker compose exec backend python manage.py showmigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py makemigrations --check --dry-run
```

Native equivalents use `python backend/manage.py ...`. Commit generated migrations with their model changes.

### PostgreSQL and Django shells

```bash
docker compose exec database psql -U spotify -d spotify
docker compose exec backend python manage.py shell
```

Useful `psql` commands:

```text
\dt                 list tables
\d accounts_user    describe user table
\du                 list roles
\l                  list databases
\q                  quit
```

Native connection:

```bash
psql -h 127.0.0.1 -p 5432 -U spotify -d spotify
```

Django user query:

```python
from apps.accounts.models import User
User.objects.values("email", "role", "is_active")
```

Passwords are hashed and cannot be queried. Reset one with:

```bash
docker compose exec backend python manage.py changepassword mahyar@example.com
```

### Backup and restore

```bash
# Create compressed backup
docker compose exec -T database pg_dump -U spotify -d spotify -Fc > spotify.dump

# Restore into the intended project database
docker compose exec -T database pg_restore -U spotify -d spotify --clean --if-exists < spotify.dump
```

For binary-safe PowerShell redirection, use:

```powershell
cmd /c "docker compose exec -T database pg_dump -U spotify -d spotify -Fc > spotify.dump"
```

Verify the target before using `--clean`.

### Reset development records

```bash
docker compose exec backend python manage.py flush
docker compose exec backend python manage.py seed_demo_data
```

`flush` permanently removes application records. `docker compose down --volumes` additionally deletes the entire database and uploaded media.

## Environment variables

### Root `.env` (Docker)

| Variable | Purpose | Example |
|---|---|---|
| `APP_PORT` | Nginx host port | `8080` |
| `POSTGRES_DB` | Database name | `spotify` |
| `POSTGRES_USER` | Database role | `spotify` |
| `POSTGRES_PASSWORD` | Database password | development only |
| `DJANGO_SECRET_KEY` | Cryptographic secret | replace outside disposable dev |
| `DJANGO_DEBUG` | Debug docs and demo seed availability | `false` |
| `DJANGO_ALLOWED_HOSTS` | Accepted hostnames | comma-separated |
| `FRONTEND_ORIGIN` | CORS and payment return origin | `http://localhost:8080` |
| `ZARINPAL_MERCHANT_ID` | Merchant UUID | sandbox UUID |
| `ZARINPAL_CALLBACK_URL` | Backend callback | app origin plus callback path |
| `SEED_DEMO_DATA` | Seed accounts at startup | `false` |

### `backend/.env` (native backend)

Start from `backend/.env.example`. Important variables:

```dotenv
DATABASE_URL=postgresql://spotify:spotify@localhost:5432/spotify
REDIS_URL=redis://127.0.0.1:6379/0
FRONTEND_ORIGIN=http://localhost:5173
DJANGO_TIME_ZONE=UTC
```

It also defines JWT lifetimes, throttle rates, media paths, ZarinPal API/StartPay/callback/timeout settings, and `ARTIST_RATE_PER_STREAM`. Never commit production secrets.

## Testing

### Frontend

```bash
npm ci
npm run test:run
npm run lint
npm run build
```

Focused example:

```bash
npm test -- --run src/__tests__/UpgradeModal.test.tsx
```

### Backend with Docker

Backend tests require PostgreSQL. `--entrypoint pytest` is important because the normal backend entrypoint starts Daphne.

```bash
docker compose up -d database redis
docker compose build backend
docker compose run --rm --entrypoint pytest backend -q
docker compose run --rm --entrypoint pytest backend apps/listening/tests/test_realtime.py -q
```

Validation commands:

```bash
docker compose run --rm --entrypoint python backend manage.py check
docker compose run --rm --entrypoint python backend manage.py makemigrations --check --dry-run
docker compose run --rm --entrypoint python backend manage.py spectacular --file /tmp/openapi.yaml --validate
```

Native backend, from `backend/`:

```bash
pytest -q
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py spectacular --file openapi.yaml --validate
```

## API and application URLs

Default Docker URLs:

| Resource | URL |
|---|---|
| React app | `http://localhost:8080/` |
| REST API | `http://localhost:8080/api/v1/` |
| Health | `http://localhost:8080/api/v1/health/` |
| Listening socket | `ws://localhost:8080/ws/listening/<invite>/` |
| Django admin | `http://localhost:8080/admin/` |
| OpenAPI schema | `http://localhost:8080/api/schema/` |
| Swagger (`DEBUG=true`) | `http://localhost:8080/api/docs/` |
| ReDoc (`DEBUG=true`) | `http://localhost:8080/api/redoc/` |

API groups:

- `/api/v1/auth/` — authentication and password reset
- `/api/v1/users/` — profiles, search, and follows
- `/api/v1/subscriptions/` — plans, entitlements, orders, and payment
- `/api/v1/music/` — catalog, playlists, streams, downloads, statistics
- `/api/v1/artists/` — artist profiles
- `/api/v1/tickets/` and `/api/v1/support/` — ticket workflows
- `/api/v1/notifications/` — notifications
- `/api/v1/artist/payouts/` and `/api/v1/admin/` — reporting/admin
- `/api/v1/listening-groups/` — room creation and invite lookup

Use Swagger/OpenAPI for exact contracts.

## Payments and group listening

### Subscription checkout

1. A listener creates an order at `POST /api/v1/subscriptions/orders/`.
2. `POST /api/v1/subscriptions/orders/<id>/pay/` requests a ZarinPal authority using the server-snapshotted IRR amount.
3. The browser opens `https://sandbox.zarinpal.com/pg/StartPay/<authority>`.
4. ZarinPal returns to `ZARINPAL_CALLBACK_URL`.
5. Django verifies authority and amount, activates the plan transactionally, and redirects to the frontend result page.

The callback must match the exposed application port. Production needs a real merchant ID and public HTTPS callback.

### Group listening

1. An authenticated user creates a temporary room over REST.
2. Invitees open `/listen/<invite>` and return there after login.
3. The client connects to `/ws/listening/<invite>/` with JWT WebSocket subprotocols.
4. PostgreSQL serializes commands; Redis broadcasts state to all members.
5. Song, play/pause, resume, seek, progress, and presence stay synchronized.
6. The room is deleted after the final connection leaves.

Browsers can block automatic sound. The room then shows **Enable audio**, which grants a local playback gesture without changing shared state.

## PWA behavior

Production builds use `public/sw.js` and the web manifest. The service worker caches the application shell and hashed assets, supplies offline navigation fallback, and deliberately excludes `/api/`, `/media/`, and WebSocket traffic.

Test a production PWA locally:

```bash
npm run build
npm run preview
```

If an old build appears, hard-refresh or clear the site's service worker and Cache Storage in browser developer tools.

## Project structure

```text
spotify-project/
|-- backend/
|   |-- apps/
|   |   |-- accounts/       users, profiles, follows, artist review
|   |   |-- subscriptions/  plans, entitlements, orders, ZarinPal
|   |   |-- music/          catalog, playlists, streams, downloads
|   |   |-- support/        tickets and messages
|   |   |-- notifications/  persistent notifications
|   |   |-- payments/       payouts and financial reports
|   |   `-- listening/      rooms and WebSockets
|   |-- config/             Django and ASGI configuration
|   |-- Dockerfile
|   `-- manage.py
|-- docker/nginx.conf       frontend/API/WebSocket/media proxy
|-- public/                 PWA assets
|-- src/                    React source and tests
|-- compose.yaml
|-- Dockerfile.frontend
|-- call-graph.md
`-- package.json
```

## Common commands

| Task | Command |
|---|---|
| Start stack | `docker compose up -d --build` |
| Container status | `docker compose ps` |
| Backend logs | `docker compose logs -f backend` |
| Migrate | `docker compose exec backend python manage.py migrate` |
| Seed accounts | `docker compose exec backend python manage.py seed_demo_data` |
| Seed music | `docker compose exec backend python manage.py seed_music` |
| Create admin | `docker compose exec backend python manage.py createsuperuser` |
| Django shell | `docker compose exec backend python manage.py shell` |
| PostgreSQL shell | `docker compose exec database psql -U spotify -d spotify` |
| Backend tests | `docker compose run --rm --entrypoint pytest backend -q` |
| Frontend tests | `npm run test:run` |
| Frontend build | `npm run build` |
| Stop, keep data | `docker compose down` |

## Troubleshooting

### Port 8080 is allocated

Set `APP_PORT=8081` and update `FRONTEND_ORIGIN` and `ZARINPAL_CALLBACK_URL` to port 8081, then rebuild.

### Demo seed is disabled

Set `DJANGO_DEBUG=true`, recreate the backend, and seed:

```bash
docker compose up -d --force-recreate backend frontend
docker compose exec backend python manage.py seed_demo_data
```

### No songs or no sound

Add expected MP3s to `backend/music_samples/`, rebuild the backend image, and run `seed_music`. A media URL should return HTTP `200`/`206` with an audio content type.

### Subscription order returns 403

Only listener accounts can purchase. Use `mahyar@example.com`. Other roles intentionally receive `subscription_purchase_forbidden`.

### ZarinPal payment cannot start

Confirm the plan currency is IRR, merchant ID is configured, callback matches the application port, and backend can access `sandbox.zarinpal.com`. Check `docker compose logs --tail 200 backend`.

### Listening room closes or does not synchronize

- Use a fresh link; empty rooms are deleted.
- Check backend and Redis health with `docker compose ps`.
- Check logs for `WSCONNECT`, `WSDISCONNECT`, or auth errors.
- Click **Enable audio** if only sound is blocked.

### PostgreSQL connection refused

Native Django uses `localhost:5432`. A Compose backend must use host `database`, which Compose configures automatically.

### Source changes are not visible

```bash
docker compose up -d --build frontend backend
```

Then hard-refresh if the PWA still serves an older shell.

## Production checklist

- Set `DJANGO_DEBUG=false` and use a long random `DJANGO_SECRET_KEY`.
- Use unique database credentials and automated backups.
- Restrict allowed hosts, CORS origin, and proxy hostnames.
- Serve HTTPS and use secure public payment callback URLs.
- Replace ZarinPal sandbox settings with production credentials.
- Persist PostgreSQL and media outside ephemeral storage.
- Run migrations, tests, lint, and builds in CI.
- Configure production Redis availability, real email delivery, monitoring, and logging.
- Review throttle rates and secret rotation.
- Never enable demo seeding or reuse demo passwords in production.

## More documentation

- [Backend notes](backend/README.md)
- [Call graph](call-graph.md)
- [Remediation report](docs/remediation-report.md)
- [Reported issues report](docs/reported-issues-remediation-report.md)
