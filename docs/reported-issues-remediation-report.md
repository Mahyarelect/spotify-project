# Reported Issues Remediation Report

## Repository checkpoint

- Starting local SHA: `8a197d757bf054cb0e0730e23b184ba4b1262781`
- Starting `origin/main` SHA: `8a197d757bf054cb0e0730e23b184ba4b1262781`
- Final implementation checkpoint before this report: `54f6c35319752dbd50ec6b1289a155bcab53b2b2`
- Branch: `fix/reported-ui-state-regressions`
- Pre-existing work preserved: untracked `backend/openapi-local.yaml`; it was not modified or staged.

Commits created:

1. `d9796fe` — `chore(brand): rename product branding to Spotify`
2. `dad4117` — `fix(auth): correct RTL copy and password validation`
3. `eece5b3` — `fix(modal): stabilize focus and delete-account inputs`
4. `e47a319` — `fix(profile): synchronize follow counts after mutations`
5. `ab2d43c` — `fix(subscription): allow duration changes after quote review`
6. `54f6c35` — `fix(nav): complete mobile drawer RTL audit`

## Changed files

Branding, metadata, documentation, and backend:

- `README.md`
- `backend/README.md`
- `backend/apps/accounts/admin.py`
- `backend/apps/accounts/serializers/auth.py`
- `backend/apps/accounts/services.py`
- `backend/apps/accounts/tests/test_auth_api.py`
- `backend/config/settings.py`
- `call-graph.md`
- `docs/reported-issues-remediation-report.md`
- `index.html`
- `package.json`
- `package-lock.json`

Frontend implementation:

- `src/components/artist/ArtistHeader.tsx`
- `src/components/auth/ArtistRegisterForm.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx`
- `src/components/layout/TopNav.tsx`
- `src/components/settings/DeleteAccountDialog.tsx`
- `src/components/subscription/SubscriptionPurchaseModal.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/PasswordInput.tsx`
- `src/components/users/UserSearch.tsx`
- `src/components/users/UserSearchResultCard.tsx`
- `src/lib/api/httpClient.ts`
- `src/lib/api/tokenStore.ts`
- `src/lib/context/AuthContext.tsx`
- `src/lib/i18n/LanguageProvider.tsx`
- `src/lib/i18n/translations/en.ts`
- `src/lib/i18n/translations/fa.ts`
- `src/lib/services/storage.ts`
- `src/lib/validation/authFieldErrors.ts`
- `src/lib/validation/authSchemas.ts`
- `src/pages/ArtistPage.tsx`
- `src/pages/ProfilePage.tsx`

Frontend regression tests:

- `src/__tests__/AuthContext.test.tsx`
- `src/__tests__/LanguageProvider.test.tsx`
- `src/__tests__/Modal.test.tsx`
- `src/__tests__/Navigation.test.tsx`
- `src/__tests__/PasswordInput.test.tsx`
- `src/__tests__/ProfilePage.test.tsx`
- `src/__tests__/TopNav.test.tsx`
- `src/__tests__/UpgradeModal.test.tsx`
- `src/__tests__/UserSearch.test.tsx`
- `src/__tests__/apiFixtures.ts`
- `src/__tests__/authForms.test.tsx`
- `src/__tests__/authSchemas.test.ts`
- `src/__tests__/authService.test.ts`
- `src/__tests__/httpClient.test.ts`
- `src/__tests__/storage.test.ts`
- `src/__tests__/tokenStore.test.ts`
- `src/__tests__/userService.test.ts`

## Root causes confirmed

1. Product branding and browser persistence namespaces still used the previous product name across UI, metadata, documentation, API settings, token keys, application storage, and the auth-expiry event.
2. Persian auth sentences were assembled from English-oriented fragments and hard-coded punctuation, which produced incomplete privacy copy and detached ASCII question marks.
3. Password input text direction and adornment placement were coupled through logical-direction utilities, so the eye control moved to the wrong physical edge in RTL.
4. The client enforced only a subset of Django's password policy, while backend password-validation messages were not consistently returned and mapped as password-field errors.
5. The shared modal focus effect depended on changing callback identities, so controlled input updates repeatedly tore down and restarted focus management.
6. Follow mutations updated only target-card state; the authenticated viewer in `AuthContext` retained a stale `followingCount`.
7. Subscription duration controls were disabled after quote creation even though the component already contained quote-invalidation logic, and modal state was not reset for every meaningful identity transition.
8. The mobile drawer relied on logical positioning without an explicit physical RTL/LTR contract and lacked regression coverage for all role links, close paths, focus restoration, and scroll locking.

## Implemented fixes

1. Renamed product display branding to `Spotify` and API branding to `Spotify API`; added one-time migration and transitional cleanup for legacy token, language, and Phase 1 storage keys.
2. Reworked English/Persian auth sentence composition, Persian punctuation, zero-width non-joiners, subscription guidance, validation messages, and settings/navigation copy.
3. Kept password values LTR while fixing the eye control to the physical right, reserving right padding and retaining a 44×44 touch target.
4. Added numeric-only client validation and field-specific localization for Django minimum-length, common, numeric, and similarity errors; invalid submissions now focus and highlight the actual field with ARIA relationships.
5. Stabilized modal callbacks through refs, added explicit initial-focus support and close locking, and made delete-account failures preserve both fields and refocus the password input.
6. Made authenticated-user refresh stable, invoked it after successful follow/unfollow mutations across profile, search, and artist views, and handled partial refresh failures without undoing successful server state.
7. Kept duration controls enabled outside active requests, invalidated stale quotes on a changed duration, rotated idempotency keys, and reset modal state across reopen/plan/mode/month/subscription changes.
8. Defined the English drawer on the physical left and Persian drawer on the physical right, preserving focus trapping/restoration, route/Escape/backdrop closing, role-aware links, and body scroll locking.

## Backend verification

Environment: isolated Python virtual environment and isolated PostgreSQL 18 instance.

- `python manage.py check`: passed — no issues.
- `python manage.py makemigrations --check --dry-run`: passed — no changes detected.
- `python manage.py spectacular --file openapi-reported-issues-final.yaml --validate`: passed.
- OpenAPI branding: `info.title` is `Spotify API`.
- OpenAPI upload contract: `PATCH /api/v1/users/me/` exposes `multipart/form-data` with `PatchedAvatarUploadRequestRequest`; `avatar` remains binary.
- `python -m pytest -q --basetemp=... -o cache_dir=...`: passed — 99 tests.
- Expected warnings: 9 JWT warnings caused by the deliberately short test/development signing key.
- No migration was created.

## Frontend verification

- `npm ci`: passed; npm reported 3 pre-existing high-severity dependency advisories.
- `npm run test:run`: passed — 29 test files, 182 tests.
- `npm run lint`: passed with 3 pre-existing Fast Refresh warnings in:
  - `src/lib/context/AuthContext.tsx`
  - `src/lib/i18n/useTranslation.tsx`
  - `src/lib/context/PlayerContext.tsx`
- `npm run build`: passed — 308 modules transformed.
- Expected build advisory: the main JavaScript chunk is 569.40 kB and exceeds Vite's 500 kB advisory threshold.

## Manual QA

Browser:

- Codex in-app Chromium browser against the current local Vite and Django servers.
- Browser console after the workflow: 0 errors, 0 warnings.

Viewports:

- `320×568`: Persian registration and mobile drawer; no horizontal overflow.
- `375×667`: mobile header/hamburger present; content width matched scroll width.
- `667×375`: mobile landscape; hamburger visible, desktop sidebar hidden, no horizontal overflow.
- `768×1024`: tablet/auth and subscription modal; no horizontal overflow.
- `1024×768`: desktop sidebar visible and hamburger hidden.
- `1440×900`: desktop layout, home branding, and Swagger UI.

English:

- Confirmed `Spotify` document title and landing/home brand.
- Listener login, logout, search, follow/unfollow, profile navigation, subscription re-quote, and desktop/mobile navigation passed.
- Artist common-password rejection remained on the password field with preserved values and focus.
- Artist, support, and admin sessions exposed exactly one appropriate dashboard link and omitted the listener-only Subscription link.

Persian/RTL:

- Language switching preserved typed registration values.
- Document direction changed to RTL while email, password, date, token, and URL inputs remained LTR.
- Both password buttons measured 44×44 CSS pixels and were physically right-aligned.
- Numeric-only, mismatch, and backend common-password errors were specific, localized, red, and focused on the invalid field.
- The artist-registration question used the Persian question mark.
- The 320 px Persian drawer ended at the physical right edge (`right = 320`) with body scrolling locked and no horizontal overflow.

Listener:

- Followed `Ali` from search: target followers changed `0 → 1`.
- Navigated through the SPA drawer to the own profile without a reload: following changed `0 → 1`.
- Unfollowed afterward to restore the seeded QA state.
- Gold renewal quote changed from 1 month / `$14.99` to 3 months / `$44.97`; the old quote disappeared before the new request and the primary review action returned.

Delete account:

- Initial focus landed on current password.
- Full password and `DELETE` values could be typed continuously.
- A wrong password preserved both values, showed the localized error, kept the dialog locked to the page, and returned focus to the password field.
- The disposable seeded account was not deleted.

Navigation roles:

- Listener: English desktop/mobile and Persian mobile manually verified.
- Artist, support, admin: English desktop role menus manually verified.
- Persian role labels and all role/direction permutations are additionally covered by `Navigation.test.tsx`.

Swagger:

- Browser title and visible heading are `Spotify API`.
- Schema generation/validation confirms the multipart avatar-upload request.

Legacy storage:

- The browser controller intentionally does not inspect local/session storage directly.
- Migration and cleanup behavior was verified by dedicated automated token, storage, language-provider, auth-context, and HTTP-client tests.

## Brand scan result

Command:

```powershell
$brandPattern = @(
  "music" + "[ _-]?app"
  "music" + " application"
  "اپلیکیشن " + "موسیقی"
  "برنامه " + "موسیقی"
) -join "|"

rg -n -i --hidden `
  --glob "!node_modules/**" `
  --glob "!dist/**" `
  --glob "!.git/**" `
  $brandPattern .
```

Result:

- All tracked repository content is clean (`git grep` returned no matches).
- The full workspace scan reports one match: `backend/openapi-local.yaml:3`.
- `backend/openapi-local.yaml` was an untracked generated artifact present before this remediation began. It was deliberately preserved and never staged, modified, or committed.

## Known limitations and non-blocking advisories

- npm reports 3 pre-existing high-severity dependency advisories.
- Lint reports 3 pre-existing Fast Refresh warnings.
- Vite reports the existing main-chunk size advisory.
- Backend tests report 9 expected short-JWT-key warnings.
- Manual QA used the project's mock subscription confirmation flow; no real payment provider was contacted.
- Password-reset email branding was verified in backend tests rather than by delivering an external email.
- The delete-account destructive success path was not run against a retained seeded account; the wrong-password, focus, validation, and modal lifecycle paths were verified manually, while successful deletion remains covered by backend/frontend tests.

## Screenshots and evidence

Artifacts are stored under:

`C:\Users\Parsa\.codex\visualizations\2026\07\21\019f865c-b0ac-74e2-8d0a-afee33afb67a`

- `reported-qa-spotify-home.png`
- `reported-qa-persian-registration.png`
- `reported-qa-password-validation.png`
- `reported-qa-delete-focus.png`
- `reported-qa-follow-count.png`
- `reported-qa-subscription-requote.png`
- `reported-qa-mobile-drawer-ltr.png`
- `reported-qa-mobile-drawer-rtl.png`
- `reported-qa-swagger-brand.png`
- `openapi-reported-issues-before.yaml`
- `openapi-branding-check.yaml`
- `openapi-reported-issues-final.yaml`
