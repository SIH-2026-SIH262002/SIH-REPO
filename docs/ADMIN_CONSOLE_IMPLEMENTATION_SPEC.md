# NER LogiSense — Admin Console Implementation Specification

> **Status**: Complete. Phases A–J done: backend contract implemented and tested, frontend built against it, two critical cross-service bugs found and fixed during live end-to-end testing (§D items 11–12, §N), cleanup done, all test suites green.
> **Author**: Claude (Sonnet 5), full Admin Console rebuild
> **Repository root**: `E:\My projects\SIH-REPO`
> **Grounding rule**: every capability, endpoint, and data point below was verified by reading the actual running source (not the aspirational docs) and exercised live against running servers — not just a test suite in isolation (§N explains why that distinction mattered). Nothing here is invented.

---

## A. Role Model

Canonical 5-role model, per `docs/architecture/ROLE_MODEL.md` and confirmed identical in both running backends (`backend/app/auth.py:32-38`, `backend/auth-service/server.js:21-29`):

| Role | Represents | Data scope | Admin-relevant note |
|---|---|---|---|
| **`ADMIN`** | System governance, identity lifecycle, ML/infra oversight | `GLOBAL` | The subject of this document |
| **`EMERGENCY_OPERATOR`** | DDMA/SDRF/NDRF/BRO control room — SOS, incident verification, corridor closures | `DISTRICT` | Legacy alias `DISTRICT_AUTHORITY` normalizes to this |
| **`LOGISTICS_OPERATOR`** | Fleet/route/supply-chain command center | `FLEET` / `RESOURCE-SCOPED` | |
| **`FIELD_OFFICER`** | Ground inspection, hazard evidence, field tasks | `ASSIGNED` | |
| **`DRIVER`** | Vehicle operation, telematics, SOS panic, en-route hazard reports | `SELF` | |

`SUPER_ADMIN` is not a 6th role — it is an internal alias that normalizes to `ADMIN` everywhere in code. There is no `WAREHOUSE_MANAGER`; warehouses are a data domain owned by `LOGISTICS_OPERATOR` (`GET /api/warehouses`), never a role.

**Admin's own boundary** (`docs/architecture/RESOURCE_SCOPE.md:153-155`): Admin is governance, not a daily operator. Admin does not dispatch fleets, does not run rescue command, does not verify incidents. The Admin Console must not duplicate the Logistics/Emergency/Field/Driver consoles — it *oversees* them.

---

## B. Admin Capability Matrix

Legend: **REAL** = live endpoint, exercised and tested · **PARTIAL** = endpoint exists but behavior is incomplete/config-dependent · **SIMULATED** = backed by an in-memory simulation engine, not physical infrastructure · **NOT CONFIGURED** = code exists but requires external service not running in this demo · **NOT IMPLEMENTED** = no backend support; will not be built.

| Capability | Backend endpoint | Method | Status | UI treatment |
|---|---|---|---|---|
| Login | `POST /auth/login` (Express) | POST | **REAL** | Login page |
| Provision user | `POST /auth/register` (Express) | POST | **REAL** | Provision User form |
| List users | `GET /auth/users` (Express) | GET | **REAL** | User Directory table |
| Suspend / reactivate / deactivate | `PATCH /auth/users/:id/status` (Express) | PATCH | **REAL** | Confirm dialog + status badge |
| Change role | `PATCH /auth/users/:id/role` (Express) | PATCH | **REAL** | Confirm dialog on User Record |
| Change district/scope | `PATCH /auth/users/:id/district` (Express) | PATCH | **REAL** | Select on User Record |
| Own profile | `GET /auth/me`, `PUT /auth/profile` (Express) | GET/PUT | **REAL** | My Account page |
| Change own password | `POST /auth/change-password` (Express) | POST | **REAL** | My Account page |
| Forgot/reset password | `POST /auth/forgot-password`, `/reset-password` (Express) | POST | **REAL** (dev: reset token is logged to server console, no email transport wired) | My Account page, with the dev-mode caveat surfaced if `NODE_ENV !== production` |
| District/corridor registry | `GET /api/sensors`, `GET /api/routes/graph` (FastAPI) | GET | **SIMULATED** telemetry, **REAL** static topology | Districts & Corridors page |
| Risk posture (nodes by category, flagged/blocked corridors) | `GET /api/dashboard/summary` (FastAPI) | GET | **SIMULATED** | Overview + Risk Intelligence |
| Live sensor deltas | `WS /ws` (FastAPI) | WS | **SIMULATED** | Risk Intelligence live indicator |
| SOS oversight (list, global for Admin) | `GET /api/sos` (FastAPI) | GET | **SIMULATED** | Emergencies & SOS table |
| Resolve SOS | `POST /api/sos/{id}/resolve` (FastAPI) | POST | **SIMULATED** | Confirm dialog |
| Field report register | `GET /api/reports` (FastAPI) | GET | **REAL** uploads, **SIMULATED** risk-override effect | Field Reports table |
| Fleet oversight | `GET /api/vehicles` (FastAPI) | GET | **SIMULATED** | Fleet & Deliveries table |
| Warehouse / supply-gap oversight | `GET /api/warehouses`, `/api/supply-gaps/intelligence` (FastAPI) | GET | **SIMULATED** | Warehouses & Supply table |
| Notification outbox / subscribers | `GET /api/notify/outbox`, `/subscribers` (FastAPI) | GET | **SIMULATED** unless Twilio keys configured — each row already carries a real `SIMULATED`/sent status | Notifications page |
| ML model metrics + feature importance | `GET /api/risk/feature-importance` (FastAPI) | GET | **REAL** — genuinely trained XGBoost/RandomForest model | Model Transparency (read-only) |
| Storm injection / reset (governance/demo control) | `POST /api/sensors/inject-storm`, `/reset-scenario` (FastAPI) | POST | **REAL** endpoint, **SIMULATED** effect; now ADMIN/EMERGENCY_OPERATOR-gated | Optional demo-control action, clearly labeled as simulation control, not a real hazard |
| Service health probes | `GET /api/health` (FastAPI), `GET /auth/me` reachability (Express) | GET | **REAL** (as a liveness probe) | Service Status page |
| Audit log viewer | — | — | **NOT IMPLEMENTED** | Omitted entirely |
| ML model deploy / rollback | — | — | **NOT IMPLEMENTED** | Omitted entirely |
| Infra telemetry (PostGIS pool, Redis hit rate, Kafka/MQTT throughput, API latency) | — | — | **NOT IMPLEMENTED** | Omitted entirely (this is exactly what the old `AdminDashboardView.tsx` fabricated) |
| IoT device health | — | — | **NOT IMPLEMENTED** | Omitted entirely |
| Risk threshold editor | — | — | **NOT IMPLEMENTED** | Omitted (thresholds are Python constants in `simulation_service.py:29-30`) |
| JWT secret / security config editor | — | — | **NOT IMPLEMENTED** — and never will be (browser-editable secrets are indefensible) | Omitted entirely |
| SOS acknowledge / dispatch | — | — | **NOT IMPLEMENTED** | Omitted entirely |
| Incident verification | — | — | **NOT IMPLEMENTED** | Omitted entirely |
| Field task assignment | — | — | **NOT IMPLEMENTED** — no Field Task entity exists | Omitted entirely |

---

## C. API Contract

### C.1 Identity & Account Lifecycle — Express `auth-service`, base `http://localhost:3000`

This is the **authoritative** identity backend for the Admin Console: persistent SQLite (Drizzle ORM), real bcrypt password hashing, real session/refresh-token rotation, and (as of this phase) a full account lifecycle. See §H.1 for why this was chosen over FastAPI's own `/api/auth/*`.

#### `POST /auth/login`
- **Auth**: none (this *is* the login)
- **Request**: `{ email?: string, identifier?: string, password: string }`
- **Response 200**: `{ accessToken, refreshToken, sessionId, expiresIn, user: {id, fullName, email, phone, role, organization, district} }`
- **Errors**: `401 {error:"Invalid credentials"}` (unknown identifier or wrong password — deliberately not distinguished) · `403 {error:"Account is suspended or deactivated..."}` if the account's derived status is not `ACTIVE`.
- **Frontend consumer**: `LoginPage` (existing).

#### `POST /auth/register` — Admin-only provisioning
- **Auth**: `authenticateMiddleware` (valid Bearer token) + `req.claims.role === 'ADMIN'` check in-handler
- **Request**: `{ email, fullName, phone?, password, role, organization?, district?, metadata? }`
- **Response 201**: `{ message, userId, user: {id, fullName, email, phone, role, organization, district} }`
- **Errors**: `401` no/invalid token · `403` authenticated but not Admin · `400` missing identifier/password or password `<8` chars · `409 {error:"Identifier/Email already exists"}`
- **Validation**: `role` and `district` are validated server-side against the canonical 5-role and 18-district lists (`identityEngine.ALLOWED_ROLES`, `core/districts.js`), matching the FastAPI mirror — an unrecognized value is rejected with `400`, never silently coerced. See §H.3 (closed this phase).
- **Frontend consumer**: Provision User form (new).

#### `GET /auth/users` — User Directory
- **Auth**: Bearer + `role === 'ADMIN'`
- **Response 200**: `{ users: [{ id, identifier, is_active, status, metadata: {fullName,email,phone,role,organization,district,accountStatus?}, created_at, updated_at }] }`
- `status` is a **server-computed** field: `metadata.accountStatus` if present, else derived from `is_active` (`ACTIVE`/`SUSPENDED`). `password_hash` is never included.
- **Errors**: `401`, `403`
- **Frontend consumer**: User Directory table.

#### `PATCH /auth/users/:id/status`
- **Auth**: Bearer + `role === 'ADMIN'`
- **Request**: `{ status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" }`
- **Response 200**: `{ message, user: <same shape as directory row> }`
- **Errors**: `400` invalid status value · `403` target is the caller's own account (self-protection) · `404` unknown user id · `409` target is `ADMIN` and this change would leave zero other active Administrators (last-admin protection; see §H.2 for why this is currently unreachable through the API but retained as defense-in-depth)
- **Side effect**: suspending/deactivating immediately blocks that account's next `login` (`403`) and next `refresh` (`is_active` check, unchanged pre-existing behavior).
- **Frontend consumer**: Account Lifecycle panel on User Record, with a typed `ConfirmDialog`.

#### `PATCH /auth/users/:id/role`
- **Auth**: Bearer + `role === 'ADMIN'`
- **Request**: `{ role: "ADMIN"|"EMERGENCY_OPERATOR"|"LOGISTICS_OPERATOR"|"FIELD_OFFICER"|"DRIVER" }`
- **Response 200**: `{ message, user }`
- **Errors**: `400` unknown role · `403` self · `404` · `409` last-admin (see above)
- **Frontend consumer**: Role reassignment on User Record, via `RoleSelectorWithBriefing`.

#### `PATCH /auth/users/:id/district`
- **Auth**: Bearer + `role === 'ADMIN'`
- **Request**: `{ district: string }` — must be one of the 18 canonical NER districts (`backend/auth-service/core/districts.js`, mirroring `backend/app/graph_data.py`)
- **Response 200**: `{ message, user }`
- **Errors**: `400` unknown district · `404`
- **Frontend consumer**: District/scope reassignment on User Record, via a `<select>` populated from `GET /api/sensors` district list (not free text).

#### `GET /auth/me`, `PUT /auth/profile`, `POST /auth/change-password`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/logout`
Unchanged, pre-existing, working. Back the Admin's own **My Account** page.

### C.2 Operational Data — FastAPI gateway, base `http://localhost:8000`

All read-only oversight surfaces. Full endpoint-by-endpoint detail already captured in the discovery phase; unchanged except where noted in §B/§D. Every one of these routes that uses `Depends(get_current_user)` or `Depends(require_roles(...))` now **requires** a valid Bearer token (see §E.1) — the frontend must attach one (see §H.4, a Phase D prerequisite).

Key routes the Admin Console consumes: `GET /api/dashboard/summary`, `GET /api/sensors`, `GET /api/routes/graph`, `GET /api/sos` (Admin sees all districts, `sos.py:41-58`), `POST /api/sos/{id}/resolve`, `GET /api/reports`, `GET /api/vehicles`, `GET /api/warehouses`, `GET /api/supply-gaps/intelligence`, `GET /api/notify/outbox`, `GET /api/notify/subscribers`, `GET /api/risk/feature-importance`, `GET /api/health`, `WS /ws`.

Newly role-gated in this phase: `POST /api/sensors/inject-storm`, `POST /api/sensors/reset-scenario` → now `require_roles(["ADMIN","EMERGENCY_OPERATOR"])` (previously open to any caller).

---

## D. Backend Security Fixes Applied This Phase

| # | File | Issue found | Fix | Verified by |
|---|---|---|---|---|
| 1 | `backend/app/auth.py` (`get_current_user`) | **Critical.** No/missing Bearer token silently returned a synthetic `LOGISTICS_OPERATOR` identity — every "protected" FastAPI route was actually open to anonymous callers. | Missing/invalid credentials now raise `401` unconditionally. No synthetic identity. | `test_protected_endpoint_rejects_missing_token`, `..._garbage_token` |
| 2 | `backend/app/routers/auth.py` (`login`) | Unknown identifier silently **auto-created** a new account on login — a self-registration path hiding inside "login", directly contradicting the closed-provisioning model. Also: `password123` worked as a **universal master password** for any account. | Removed auto-create; unknown identifier and wrong password both return a generic `401`. Removed the universal-password bypass — only an account's own real password is accepted. Added suspended/deactivated check before issuing tokens. | `test_login_rejects_unknown_identifier_instead_of_auto_creating`, `..._wrong_password`, `..._universal_demo_password_bypass` |
| 3 | `backend/app/routers/auth.py` (`refresh`) | A refresh token whose `sub` no longer resolved to a real account minted a fresh access token for a **fabricated** "Field Officer" identity instead of failing. Also never checked account status. | Unresolvable subject → `401`. Suspended/deactivated → `403`. | `test_refresh_rejects_token_for_unknown_subject` |
| 4 | `backend/app/routers/auth.py` (`register`) | Manually re-implemented JWT decoding to check for an Admin caller, duplicating `app.auth`'s verified decoder. Role/district accepted any string. | Now uses the shared `require_roles(["ADMIN"])` dependency; added a live-active-admin re-check (`_require_live_admin`); role and district validated against the canonical 5-role and 18-district lists; password minimum length enforced. | `test_register_rejected_without_authentication`, `..._for_non_admin_caller`, `..._rejects_unknown_role`, `..._rejects_unknown_district`, `..._rejects_short_password`, `test_admin_can_provision_user_with_valid_role_and_district` |
| 5 | `backend/app/routers/sensors.py` | `inject-storm` and `reset-scenario` (documented as ADMIN/EMERGENCY_OPERATOR actions) were callable by anyone, unauthenticated. | Gated with `require_roles(["ADMIN","EMERGENCY_OPERATOR"])`. | `test_inject_storm_requires_admin_or_emergency_operator_role` |
| 6 | `backend/auth-service/router/index.js` (`/register`) | **Bug, not just a gap.** The admin-only guard checked `req.user?.role`, a field nothing ever sets — `authenticateMiddleware` attaches `req.claims`, not `req.user`. The check always evaluated false, so *every* call, including a genuine Admin's, was rejected with `403`. This also meant the endpoint was accidentally "secure" (nobody could use it at all) rather than correctly secure. | Added the missing `authenticateMiddleware`; fixed the check to `req.claims?.role === 'ADMIN'`; added an 8-character password minimum matching the FastAPI side. | `1a/1b/1c` in `tests/integration/api.test.js` (401 → 403 → 201 across the three cases) |
| 7 | `backend/auth-service/router/index.js` (`/login`) | Never checked account status at all — a suspended/deactivated user could still log in and receive a fresh token (only `refresh` checked `is_active`). This would have made "suspend user" a no-op until an existing token happened to expire. | Login now checks `identityEngine.deriveAccountStatus()` and returns `403` for non-`ACTIVE` accounts, before issuing tokens. | `lifecycle.test.js`: "Admin suspends a user, suspended user is blocked from login" |
| 8 | `backend/auth-service/adapters/storage/mock.js` | `updateUserMetadata`, `setActive`, and `getAllUsers` were **never implemented** on the mock storage adapter, even though the router already called the first two (`/profile`, `/users`) — meaning those two existing endpoints had never been exercised by any test against the mock, only manually against the real SQLite adapter. | Implemented all three, matching the SQLite adapter's contract exactly. | `lifecycle.test.js` (all tests use the mock adapter) |
| 9 | Seed data inconsistency | The demo `driver@nerlogisense.gov.in` account's `district` field was `"Guwahati"` — a town/node name, not a district (the real district is `"Kamrup Metro"`). Harmless until district became a validated field; now it would have failed the new validation had it gone through `/register`. Same bug found on the seeded **admin** account's district (`"Shillong"` → `"East Khasi Hills"`) during Phase D's live smoke test; corrected in both `backend/app/routers/auth.py` and `backend/auth-service/server.js`'s seed data. | Corrected both seed values. | Visual inspection + `CANONICAL_DISTRICTS` cross-check + live re-seed verified via `GET /auth/users` |
| 10 | `backend/auth-service/router/index.js` (`/register`) | Role/district accepted any string, silently coercing an unrecognized role to `FIELD_OFFICER` via a local `normalizeCanonicalRole()` (§H.3, originally logged as a deferred gap — closed within Phase D instead once the Provision User form needed real end-to-end verification). | Validated against `identityEngine.ALLOWED_ROLES` / `core/districts.js`'s `CANONICAL_DISTRICTS`; rejects with `400`, matching the FastAPI mirror. Removed the now-dead `normalizeCanonicalRole()` helper. | `tests/integration/api.test.js`: "1d. Register rejects an unrecognized role", "1e. ...unrecognized district" |
| 11 | **Critical — found only by live end-to-end testing, not by reading the code.** `backend/app/auth.py` (`decode_jwt`) | The claim-shape incompatibility flagged in the original §E finding #3 as "not exploitable, degrades not upgrades, not blocking" was **wrong** — verified live by actually starting both services and calling a FastAPI Admin-gated route with a real Express-issued token: it returned `401` every time. Express nests identity under `claims` (`{sub, sid, claims: {role, district, ...}, tenant}`); FastAPI's decoder only ever read a top-level `role`/`district`. Since the Admin Console logs in **exclusively** through Express (§H.1), this meant **every single Admin oversight page** (`/admin/risk`, `/admin/emergencies`, `/admin/fleet`, `/admin/supply`, `/admin/notifications`, storm injection, etc.) would 401 forever for a correctly-authenticated Administrator — not a theoretical edge case, but the primary path completely broken. | `decode_jwt` now hoists `role`, `roles`, `fullName`, `email`, `phone`, `district`, `organization` from a nested `claims` object to the payload's top level (only when not already present there), before the existing role-normalization logic runs. FastAPI-issued tokens (which already have these fields at the top level) are unaffected. | New test: `test_express_shaped_token_with_nested_claims_role_is_understood_as_admin` (constructs an Express-shaped JWT directly, independent of the Node service, so this stays covered even if only the Python suite runs) + live curl verification against both running services (see §E.3, now marked FIXED) |
| 12 | Environment: `JWT_SECRET` mismatch between services | Found during the same live test as #11. `backend/.env` (gitignored, local) had a real generated `JWT_SECRET`; `backend/auth-service/` had no `.env` at all, so it silently fell back to its own hardcoded demo default — a **different** secret than FastAPI's. Every Express-issued token then failed signature verification against FastAPI outright (a stricter failure than #11 — it never even reached the claims-hoisting logic). This is not a code bug (the two hardcoded fallback defaults are identical by design, so a truly fresh clone with no `.env` files at all works correctly); it only manifests once someone sets a real secret in one service's `.env` without mirroring it to the other, which is exactly what had happened in this environment and has no obvious error message pointing at the cause. | Created `backend/auth-service/.env` with the matching secret for this environment. Rewrote `backend/auth-service/.env.example` (previously a comment-only, un-copyable template) into a real template, and added an explicit cross-reference comment to `backend/.env.example` / root `.env.example`: `JWT_SECRET` must be byte-for-byte identical across `backend/.env` and `backend/auth-service/.env`. | Live: cross-service Admin token calls returned `200`/`403` as expected after the fix, vs. `401`/signature-error before it |

**Test coverage added**: 15 new pytest tests (`backend/tests/test_auth.py`, run via `backend/pytest.ini` + `python -m pytest` from `backend/`) and 22 new Jest tests (`backend/auth-service/tests/integration/lifecycle.test.js` + rewritten/extended sections of `api.test.js`/`attacks.test.js`). **Baseline before this phase**: the Express suite was already failing 10 of 17 tests (a prior, unrelated change had added the closed-registration guard to `/register` without updating its tests — those tests asserted the *old* open-registration behavior). **After this phase**: 15/15 Python, 30/30 Node, all green — verified both via the test suites and via a live end-to-end smoke test against both running services (login → provision → validate → suspend → login-blocked → reactivate → login-restored → self-protection → cross-service Admin token → non-admin 403), documented in full in §N.

---

## E. Real-Time / Cross-Cutting Findings

1. **FIXED (Phase D).** `services/apiService.ts` sent no Authorization header at all. Added a request interceptor (mirroring `api/apiClient.ts`'s) that attaches the stored access token to every FastAPI call. Verified live: `/api/vehicles`, `/api/sos`, `/api/warehouses` etc. now return `200` for an Admin token, `401` for none.
2. **FIXED (Phase D).** `VITE_API_URL` collision — one variable was asked to serve both the Express auth-service (`:3000`, bare `/auth/*`) and the FastAPI gateway (`:8000`, `/api/*`, and needing the `/api` suffix baked into the base URL for `apiService.ts`'s relative paths to resolve at all). Introduced `VITE_AUTH_URL` (default `http://localhost:3000`) for `api/apiClient.ts`; corrected `VITE_API_URL` to `http://localhost:8000/api` (previously missing the `/api` suffix — a second, compounding bug in the same `.env`) for `services/apiService.ts`. Both `.env` and `.env.example` corrected.
3. **FIXED (Phase D) — this finding's original risk assessment was WRONG.** Originally logged as "not exploitable, degrades not upgrades, not blocking, documented for future hardening." Live end-to-end testing (starting both real services and calling a FastAPI Admin route with a genuine Express-issued Admin token) proved this was actually **the single most severe bug found in this entire phase**: it 401'd every Admin oversight page, unconditionally, for a correctly-authenticated Administrator. See §D item 11 for the full fix (claims-hoisting in `decode_jwt`) and §D item 12 for a second, compounding environment bug (mismatched `JWT_SECRET` between the two services) discovered in the same test. **Lesson applied**: a finding reasoned about from reading code, without exercising it against a real running counterpart service, is not verified — this is why §N below is a live smoke test, not just a test-suite run.
4. **`/ws` (FastAPI WebSocket) has no authentication.** Broadcasts only simulated telemetry (no PII), so risk is low, but it is unauthenticated. Not fixed this phase (see task scope: "Also inspect" list, not "fix this first").
5. **`POST /api/sos`, `GET /api/routes/plan`, `POST /api/notify/subscribe`** remain unauthenticated. These back the Driver SOS panic button and other non-Admin flows; gating them now, with `apiService.ts` sending tokens (finding #1, now fixed), would break those flows for the Driver/other roles without a corresponding fix to their views, which is out of scope for the Admin Console. Deliberately left open for those flows; not consumed by any Admin-only write action.

---

## F. Admin Information Architecture

```
NER LogiSense · Administration Console
──────────────────────────────────────
OVERVIEW                        /admin

ADMINISTRATION
  User Directory                /admin/users
  Provision User                /admin/users/provision
  User Record                   /admin/users/:userId
  Roles & Access Reference      /admin/roles
  Districts & Corridors         /admin/districts

OPERATIONS OVERSIGHT
  Risk Intelligence             /admin/risk
  Emergencies & SOS             /admin/emergencies
  Field Reports                 /admin/field-reports
  Fleet & Deliveries            /admin/fleet
  Warehouses & Supply           /admin/supply

PLATFORM
  Notifications & Outbox        /admin/notifications
  Model Transparency            /admin/model
  Service Status                /admin/status

ACCOUNT
  My Account                    /admin/account
  Sign out
```

Dropped from the original hypothesis (no backend): **Audit/Security log viewer**, **ML Governance rollback/deploy**, **Integrations config**. Retained in trimmed, honest form: **Model Transparency** (read-only metrics), **Service Status** (real probes, not fabricated infra metrics).

### Overview page priority order
1. **What needs attention** — active SOS count, severe/high-risk node count, blocked corridors, active ground-truth overrides (nodes with `manual_flag != null`).
2. **Who has access** — total users, breakdown by role (5), inactive count, districts with zero assigned personnel.
3. **What is happening** — district risk register (18 rows), recent alerts, fleet status rollup.
4. **Is the platform healthy** — per-service probe results with provenance badges.

---

## G. Route Map

| Route | Page component | Primary data source(s) |
|---|---|---|
| `/admin` | `AdminOverviewPage` | `/api/dashboard/summary`, `/api/sos`, `/auth/users`, `/api/alerts` |
| `/admin/users` | `UserDirectoryPage` | `/auth/users` |
| `/admin/users/provision` | `ProvisionUserPage` | `POST /auth/register` |
| `/admin/users/:userId` | `UserRecordPage` | `/auth/users` (find by id) + lifecycle PATCH endpoints |
| `/admin/roles` | `RolesReferencePage` | static content from `ROLE_MODEL.md` |
| `/admin/districts` | `DistrictRegistryPage` | `/api/sensors`, `/api/routes/graph`, `/auth/users` (staffing overlay) |
| `/admin/risk` | `RiskIntelligencePage` | `/api/dashboard/summary`, `/api/sensors`, `/ws` |
| `/admin/emergencies` | `EmergencyOversightPage` | `/api/sos`, `/api/alerts` |
| `/admin/field-reports` | `FieldReportsPage` | `/api/reports` |
| `/admin/fleet` | `FleetOversightPage` | `/api/vehicles` |
| `/admin/supply` | `SupplyOversightPage` | `/api/warehouses`, `/api/supply-gaps/intelligence` |
| `/admin/notifications` | `NotificationsPage` | `/api/notify/outbox`, `/api/notify/subscribers` |
| `/admin/model` | `ModelTransparencyPage` | `/api/risk/feature-importance` |
| `/admin/status` | `ServiceStatusPage` | live probes against all of the above |
| `/admin/account` | `AccountPage` | `/auth/me`, `PUT /auth/profile`, `POST /auth/change-password` |

All wrapped in `<ProtectedRoute allowedRoles={['ADMIN']}>` → `<AdminLayout>`, replacing the current `useState('dashboard'|'route-planner'|...)` tab-switcher in `DashboardPage.tsx` with real nested React Router routes (deep-linkable, correct back-button behavior).

---

## H. Component Hierarchy (for Phase D)

```
routes/AdminRoutes.tsx
└── ProtectedRoute allowedRoles={['ADMIN']}
    └── layout/AdminLayout
        ├── AdminTopBar
        ├── AdminSidebar   (grouped nav per §F)
        └── <Outlet/>

components/admin/primitives/
  PageHeader · SectionCard · MetricTile · DataTable<T> · StatusBadge
  RoleBadge · ScopeBadge · ConfirmDialog · FormField · Select · SearchInput
  FilterBar · Pagination · LoadingState · EmptyState · ErrorState
  PermissionDeniedState · ServiceUnavailableState · DataProvenanceBadge

components/admin/users/
  UserDirectoryTable · UserFilters · ProvisionUserForm
  RoleSelectorWithBriefing · DistrictScopeSelector
  UserRecordHeader · UserAccessSummary · AccountLifecyclePanel

components/admin/ops/
  DistrictRiskTable · RiskCategoryBar · SosEventTable · ResolveSosDialog
  FieldReportTable · GroundTruthOverrideNotice · FleetTable
  WarehouseTable · SupplyGapTable · OutboxTable · SubscriberTable
  FeatureImportanceChart · ServiceStatusList

hooks/admin/
  useAdminUsers · useDashboardSummary · useSosEvents · useServiceProbes · useSortableTable

api/adminApi.ts   -- new, typed, calls ONLY the endpoints in §C (no invented calls)
```

**As-built note**: this was a pre-implementation hypothesis; a few consolidations turned out cleaner once actually building against it, and were kept rather than forced back to match the sketch:
- `useAdminUsers`/`useDashboardSummary`/`useSosEvents` collapsed into one generic `hooks/admin/useAsyncData.ts` (fetch-on-mount + refetch + loading/error state) — three near-identical hooks added indirection with no behavioral difference between them.
- `useSortableTable` folded directly into `DataTable<T>` itself (sort state + pagination live there) rather than a separate hook nothing else would reuse.
- `components/admin/ops/` (per-domain table wrappers like `FleetTable`, `WarehouseTable`, `SosEventTable`) was not built as a separate layer — each oversight page builds its `DataTableColumn<T>[]` inline and hands it to the shared `DataTable`. A wrapper component that's "`DataTable` with these columns, used exactly once" is not reuse, it's a detour; `EmergencyOversightPage`'s resolve-confirmation is a local `ConfirmDialog` usage rather than a dedicated `ResolveSosDialog` for the same reason.
- `Select`/`FilterBar`/`ScopeBadge` were not built as standalone primitives — role/status filters are plain `<select>`s styled with `FormField`'s shared `inputBaseClass`, and district renders as plain text in tables (a `RoleBadge` earns its keep because role recurs with icon+color semantics across many pages; a bare district string does not need the same treatment).
- `FeatureImportanceChart` is inlined in `ModelTransparencyPage` (its only consumer) as a small set of CSS bar rows, not a chart library.

---

## H.1 Why Express, not FastAPI, for identity/lifecycle

This phase initially implemented the lifecycle endpoints in FastAPI's `USERS_DB` (in-memory dict) before reconsidering. The correction, and why it matters:

- FastAPI's own code comment on that dict reads `# In-memory user database for demo/fallback` — self-described as secondary.
- Express has the actual persistent store (SQLite via Drizzle: `users`, `sessions`, `password_reset_tokens` tables), real bcrypt hashing, and already-complete profile/password-reset flows that FastAPI's mirror lacks entirely.
- `backend/auth-service/.env.example` already documents `VITE_API_URL=http://localhost:3000` for the frontend — i.e., the project's own config template says the frontend's identity calls go to Express.
- `authApi.ts`'s existing paths (`/auth/login`, `/auth/me`, `/auth/profile`, `/auth/change-password`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/users`) are Express's bare `/auth/*` shape, not FastAPI's `/api/auth/*` shape.
- The task's own suggested route convention (`PATCH /auth/users/:id/status`) matches Express's mount prefix exactly.

Building lifecycle in both places would violate "do not create duplicate APIs." FastAPI's `/api/auth/*` remains in place, security-hardened (§D items 1–5), for its documented purpose: a zero-setup demo/fallback login when the Express service isn't running. It intentionally does **not** grow new lifecycle endpoints.

## H.2 Why the "last active Administrator" 409 is currently unreachable (and kept anyway)

Given (a) self-protection blocks an Admin from acting on their own account, and (b) `_require_live_admin`/live-status enforcement on the acting caller, the acting Admin is always active-and-not-the-target. So after any single-target lifecycle change, the acting Admin alone already guarantees ≥1 active Administrator remains. The 409 guard can only ever fire in a scenario this API doesn't expose today (e.g. a future bulk-action endpoint, or if self-protection were ever removed). It costs nothing to keep and directly documents intent, so it stays as defense-in-depth — this is stated plainly rather than pretending it's a fully exercised safeguard.

## H.3 Closed: Express `/register` now validates role/district

FastAPI's `/api/auth/register` (§D item 4) already rejected an unrecognized role or district with `400`. Express's `/auth/register` previously silently coerced an unrecognized role to `FIELD_OFFICER` via a local `normalizeCanonicalRole()` and accepted any district string. During Phase D this was closed: the handler now validates `role` against `identityEngine.ALLOWED_ROLES` and `district` against `core/districts.js`'s `CANONICAL_DISTRICTS`, rejecting either with `400` rather than coercing. The now-unused `normalizeCanonicalRole()` helper was removed. Covered by `tests/integration/api.test.js` ("1d. Register rejects an unrecognized role", "1e. ...unrecognized district").

## H.4 Required Phase D frontend prerequisite

Before any Admin oversight page (Overview, Risk, Emergencies, Field Reports, Fleet, Supply, Notifications) can load real data, `services/apiService.ts` needs an Authorization-header interceptor (mirroring `api/apiClient.ts`'s existing one), and the `VITE_API_URL`/`VITE_AUTH_URL` split from §E.2 needs to land. Without both, every one of those pages will correctly receive `401` from the now-secured FastAPI endpoints — which is the *correct* backend behavior, but means these two frontend fixes are load-bearing, not optional polish, for Phase D.

---

## I. Data Provenance Model

Every data-driven Admin panel must carry a `DataProvenanceBadge` reflecting the honest status from §B:

- **LIVE** — real backend computation/storage (user directory, provisioning, lifecycle, ML feature importances, service health probes)
- **SIMULATED** — backed by `simulation_service.py`'s drift engine or in-memory demo state (risk scores, SOS events, fleet positions, warehouse stock, notification outbox unless Twilio keys present)
- **NOT CONFIGURED** — code path exists but requires an external service not running (Twilio, OpenWeatherMap, Spring Boot core, Kafka/Redis/PostGIS)
- **NOT IMPLEMENTED** — no backend support; the capability is not shown at all, not stubbed

No panel may claim `LIVE` for simulated data. No panel may fabricate a number with no backend source (this is the exact failure mode of the current `AdminDashboardView.tsx`, being fully replaced).

---

## J. Security Rules for the Admin Console

1. **Route guards are UX only.** `ProtectedRoute allowedRoles={['ADMIN']}` prevents accidental navigation; the backend independently rejects every request regardless of what the frontend renders (verified: §D items 1, 4, 5 all reject at the API layer even with a crafted request).
2. **No role switcher.** `RoleSwitcherBar.tsx` is removed from the Admin build path — production role comes only from the verified JWT via `/auth/me`.
3. **No public registration.** `/register` stays redirected to `/login`; `RegisterPage.tsx`/`RegisterForm.jsx` removed from the Admin bundle.
4. **Destructive actions require a typed `ConfirmDialog`** (target name, current role, current district, the specific consequence) — never `window.confirm`/`alert`. The old `AdminDashboardView.tsx`'s self-protection `alert()` is being replaced with both a disabled UI affordance *and* the real backend 403 (§D item — self-protection is now server-enforced, not frontend-only).
5. **No secrets in the browser.** JWT secret / security config editing is explicitly out of scope (§B, NOT IMPLEMENTED, and never will be).
6. **Error handling**: every page distinguishes `401` (session expired → re-auth), `403` (permission denied → explicit message, not a blank screen), `404`, `409` (lifecycle conflict, e.g. last-admin), and `5xx`/network failure (service unavailable, with retry).

---

## K. Page-by-Page Acceptance Criteria

- **Overview**: loads all four bands independently — a failure in one data source (e.g. `/auth/users` unreachable) degrades only that band, not the page. Every metric has a context sub-line. No card renders with zero real data behind it.
- **User Directory**: search, filter (role/district/status), sort, paginate ≥25 rows/page. Empty state distinguishes "no users match your filter" from "no users exist." 403 state distinguishes from network failure.
- **Provision User**: role selection shows the `RoleSelectorWithBriefing` (responsibility/scope/key-access text from `ROLE_MODEL.md`) before submission is enabled. District is a `<select>` of the 18 canonical districts, never free text. Server-side `400`/`409` errors surface inline, not as a generic failure.
- **User Record / Account Lifecycle**: status/role/district changes each open a `ConfirmDialog` naming the exact consequence. A `403` "cannot act on own account" or `409` "last Administrator" response renders as an explained, disabled state — not a raw error toast.
- **Districts & Corridors**: uses the existing Leaflet map component; district names, node names, corridor names all match `graph_data.py` verbatim — no invented geography.
- **Risk Intelligence / Emergencies / Field Reports / Fleet / Supply / Notifications**: each shows LIVE/SIMULATED provenance per §I, has loading/empty/error/service-unavailable states, and — critically — correctly fails with a clear "Session expired" or "Service unavailable" message once §H.4's frontend auth-header fix is in place (before that fix lands, these pages will legitimately 401; that is documented, not a regression to paper over).
- **Model Transparency**: shows the real trained metrics (MAE, R², ROC-AUC) and feature importances exactly as returned by `/api/risk/feature-importance` — no version history, no deploy/rollback controls.
- **Service Status**: each row is a real probe result (reachable/unreachable + latency), never a fabricated percentage.
- **My Account**: profile edit and change-password both round-trip against the real Express endpoints; forgot/reset-password flow is shown with an explicit "development mode: reset link is not emailed" note matching actual current behavior (`server.js:70-76`).

---

## L. Implementation Order (remaining)

Phases A (audit), B (security/backend contract), C (this document) are complete. Remaining:

- **Phase D** — Admin design system: tokens, `AdminLayout`/`AdminSidebar`/`AdminTopBar`, all 19 primitives, `AdminRoutes.tsx`, **plus the two load-bearing frontend fixes in §H.4** (auth-header interceptor on `apiService.ts`, `VITE_AUTH_URL` split).
- **Phase E** — Administration: Users → Provisioning → User Record → Roles & Access → Districts.
- **Phase F** — Overview.
- **Phase G** — Oversight: Risk → SOS → Field Reports → Fleet → Supply.
- **Phase H** — Platform: Notifications → Model Transparency → Service Status → My Account.
- **Phase I** — Cleanup (done): removed `AdminDashboardView.tsx`, `RegisterPage.tsx`, `RegisterForm.jsx`, `RoleSwitcherBar.tsx` (all verified orphaned before deletion — grepped for references first) and the dead `AdminDashboardView` import/branch in `DashboardPage.tsx`'s tab-state path. Stripped the silent-fallback methods in `apiService.ts` that only `AdminDashboardView.tsx` used (`getDeviceTelemetry`, `getAlertPolicies`, `triggerScenario`). **Kept** `getThermalBudget`/`getCorridorRecovery` — checked their usage first and found `LogisticsOperatorView.tsx`/`EmergencyOperatorView.tsx` (other roles, out of scope for this rebuild) still call them; removing those would have broken those consoles' builds for no reason connected to this task.
- **Phase J** — Testing: done, see §N.

---

## M. Tests to Run Before Declaring Any Phase Complete

```bash
# Python / FastAPI gateway
cd backend && ../.venv/Scripts/python.exe -m pytest -q

# Express auth-service
cd backend/auth-service && npx jest

# Frontend
cd apps/web-dashboard && npm run build && npm run lint
```

Current state: **15/15 Python tests pass, 30/30 Node tests pass, frontend build clean.** `npm run lint` reports 2 pre-existing errors in `src/lib/authApi.js`, a file this phase never touched (confirmed via `git diff --stat` showing no changes) — not introduced by this work, left as-is per "do not blindly modify unrelated systems."

---

## N. Live End-to-End Smoke Test (Phase J)

A test-suite pass is necessary but not sufficient — §E item 3 was wrongly assessed as low-risk purely from reading code, and turned out to be the most severe bug in this phase. So before declaring the backend contract genuinely done, both real services were started (`node server.js` on :3000, `uvicorn app.main:app` on :8000) and driven end-to-end with `curl`, exactly as the frontend would:

1. `POST /auth/login` as the seeded Admin → `200`, real access/refresh tokens.
2. `GET /auth/me` with that token → `200`, correct identity.
3. `GET /auth/users` → `200`, all 3 seeded accounts, correct `status`/`is_active`/`metadata` shape (matches `AdminUserRecord` exactly).
4. `POST /auth/register` provisioning a valid `EMERGENCY_OPERATOR` in `Cachar` → `201`.
5. Same, with role `WAREHOUSE_MANAGER` → `400`. Same, with district `Atlantis` → `400`.
6. `PATCH /auth/users/:id/status {SUSPENDED}` on the new user → `200`; that user's next `POST /auth/login` → `403`.
7. `PATCH .../status {ACTIVE}` → `200`; that user's next login → `200` again.
8. Admin attempting to suspend **their own** account → `403` (self-protection).
9. The `officer` (`FIELD_OFFICER`) token against `GET /auth/users` → `403` (not `401` — correctly authenticated, correctly denied).
10. No token at all against `GET /auth/users` → `401`.
11. **The critical one**: the Express-issued Admin token against FastAPI's `GET /api/vehicles`, `GET /api/sos`, `GET /api/warehouses`, `POST /api/sensors/inject-storm` — all `401` on the first pass. Root-caused to two independent bugs (§D items 11–12), both fixed, then all four calls re-verified: `200`/`200`/`200`/`200` (storm injection returned a real, correctly-computed risk score for the injected node).
12. The `officer` token against the ADMIN-only `GET /api/sos` on FastAPI → `403` (not `401`) — confirms the claims-hoisting fix reads role correctly for a *denied* case too, not just the allowed one.
13. Reset the demo scenario back to baseline (`POST /api/sensors/reset-scenario`) so the storm injected during testing doesn't linger for the next person to run the demo.

All 13 steps passed after the fixes in §D items 11–12. This is the evidence behind marking §E items 1–3 "FIXED" rather than "should work in theory."
