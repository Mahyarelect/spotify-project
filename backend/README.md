# Backend

The backend is a Django REST Framework application backed exclusively by PostgreSQL.

## Local setup

1. Create a PostgreSQL database and user matching `DATABASE_URL`.
2. Copy `.env.example` to `.env` and replace the development secret.
3. Create and activate a Python 3.12 virtual environment.
4. Install dependencies with `pip install -r requirements.txt`.
5. Run `python manage.py migrate` and `python manage.py runserver`.

The API health check is available at `GET /api/v1/health/`. In debug mode, OpenAPI documentation is available at `/api/docs/` and `/api/redoc/`.

## Verification

```bash
pytest
python manage.py check
python manage.py spectacular --file openapi.yaml --validate
```

Automated tests intentionally target PostgreSQL. SQLite is not a supported application or test database.
