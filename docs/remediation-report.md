# Phase 2 remediation report

## Baseline

- Starting commit: `d02e59d`
- Latest `main`: already up to date on 2026-07-23
- Backend: 77 tests passed
- Frontend: 112 tests passed across 21 files
- Django system check: no issues
- Migration drift: none
- OpenAPI validation: passed
- Frontend lint: passed with three existing `react(only-export-components)` warnings
- Production build: passed with the existing Vite chunk-size advisory

The original ignored `.pgdata` cluster was stopped and its control file was not
compatible with the installed PostgreSQL 18 runtime. Baseline backend checks
were therefore run against a new isolated PostgreSQL 18 cluster on port 65210;
this was an environment-only issue and no application failures were recorded.
Pytest also required an explicitly writable temporary directory for four avatar
tests.

## Confirmed contracts

- Tokens use the `musicapp_access_token` and `musicapp_refresh_token`
  `sessionStorage` keys.
- Logout posts the refresh token to `POST /api/v1/auth/logout/` and clears both
  tokens even when that request fails.
- Current-user responses include private profile fields, preferences, nullable
  `streams_today`, and effective subscription data.
- Public-profile responses omit email, demographics, preferences, and
  subscription dates.
- Password reset confirmation already exists at
  `POST /api/v1/auth/password-reset/confirm/`.
- Existing protected routes authenticate users but dashboard role routing is
  currently implemented inside page content rather than at the route boundary.

## Expected remediation areas

- Localization context, translations, authentication layout, and settings
- Password and authentication forms plus reset-password routing
- Shared navigation, mobile drawer, logout, and dashboard guards
- Profile rendering and date/identity formatting
- Account search API, frontend search, and follow state
- Subscription order projection and renewal UI
- Profile OpenAPI request schema
- Regression tests, responsive/RTL verification, and project documentation

This report is updated as later phases are verified.
