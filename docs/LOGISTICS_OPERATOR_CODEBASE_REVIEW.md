# Logistics Operator Codebase Review — Audit & Repair

This document records a resumed audit/repair pass over the Logistics Operator
workflows across the FastAPI backend (`backend/app`), the Java core-service
(`backend/core-service`, currently orphaned — see §Architecture Note), and
the web dashboard (`apps/web-dashboard`). No prior version of this file
existed in the repo; this is the first pass, written after inspecting an
interrupted in-progress rebuild of the Logistics Operator frontend that was
already substantially complete in the working tree (new `/logistics/*` route
tree replacing the old `LogisticsOperatorView.tsx`).

Scope discipline: per instruction, this pass **did not** begin or extend the
Logistics Operator frontend rebuild. The new `/logistics/*` page set was
already built by a prior session; this pass audited it for the zero-false-
data and security mandates and repaired what it found, without adding new
screens or redesigning the UI.

## Architecture Note (load-bearing for everything below)

`start.bat` launches exactly three processes: the FastAPI backend (port
8000), the Node/Express auth-service (port 3000), and the Vite frontend
(port 5173). **The Java core-service (`backend/core-service`) is never
started and nothing in the frontend calls it any more** — confirmed by
grepping the entire `apps/web-dashboard/src` tree for `8080`/`core-service`.
The one place that used to call it directly (`IncidentImpactModal.tsx`, via
an unauthenticated `fetch('http://localhost:8080/...')`) has been rewired in
this pass to call the real, authenticated FastAPI endpoint instead. All live
Logistics Operator functionality — fleet, deliveries, routing, rerouting,
warehouses, supply intelligence, incidents, notifications — runs entirely
through `backend/app` (FastAPI). This matters because several of the worst
fabricated-data findings live in Java core-service files that are simply not
reachable by any current user; they are documented below as real defects but
were not prioritized for a full rewrite, since that would mean building out
an entire disconnected module's business logic rather than repairing a live
path.

## Completed

### Security

- **`backend/app/routers/risk.py`** — `/predict`, `/feature-importance`,
  `/model-info` had *no* authentication dependency at all (fully public).
  Added `Depends(get_current_user)` to all three.
- **`backend/app/routers/sensors.py`** — `list_sensors` / `get_sensor` had no
  authentication (fully public sensor telemetry). Added
  `Depends(get_current_user)`. `inject-storm` / `reset-scenario` were already
  correctly role-gated to ADMIN/EMERGENCY_OPERATOR and were left unchanged.
- **`backend/app/routers/vehicles.py`** — `/me` (driver-assigned-vehicle
  lookup) no longer fabricates a "default fleet unit" for an unmatched
  driver (see Zero-False-Data below); this was also a latent security issue,
  since it would have handed one driver a vehicle that actually belonged to
  someone else.
- **`backend/core-service/.../reroute/RerouteOrderController.java`** — had
  *no* `@PreAuthorize` on any endpoint (relied only on the blanket
  `.anyRequest().authenticated()` in `SecurityConfig`, so any authenticated
  role — including a Driver — could approve/reject/emergency-override
  reroutes). Added `@PreAuthorize` using the existing `ROUTE_APPROVE` /
  `DECISION_APPROVE` / `EMERGENCY_CORRIDOR_MANAGE` permissions already
  defined on `UserRole`. Client-supplied `operatorUsername` /
  `emergencyOperatorUsername` request-body fields were trusted verbatim as
  the approver identity — replaced with `@AuthenticationPrincipal User actor`
  (the same pattern already used correctly in `ShipmentController`). Also
  removed a `body.get("id") != null ? ... : 1L` default that would silently
  act on reroute order #1 if the caller omitted an id — now 400s.

### Zero False Data

- **`backend/app/routers/vehicles.py` `/me`** — previously matched a driver
  by comparing against a `driver` field that doesn't exist on `VEHICLES`
  entries (the real field is `driver_name`), so the match essentially never
  succeeded — meaning the "assign the first fleet vehicle as a demo
  fallback" branch fired on almost every real request, silently telling a
  driver they were assigned someone else's vehicle. Fixed the field-name bug
  and removed the fabricated fallback entirely; an unmatched driver now
  correctly gets `{"assigned": false}`.
- **`backend/core-service/.../RerouteOrderService.java`** — `approveReroute`
  / `rejectReroute` / `emergencyOverride` silently fabricated and **persisted
  to the database** a brand-new `RerouteOrder` row with hardcoded values
  (`"SHP-07"`, `"NER-07"`, `"NH-27_HAFLONG_PASS"`, confidence `0.92`/`1.0`)
  whenever the requested `id` didn't exist, instead of 404ing. Now returns
  `Optional.empty()` → the controller returns 404. Also removed the
  `"channel": "TWILIO_SMS_MOCK"` / `"status": "DISPATCHED"` response on
  `sendDriverInstructions`, which claimed a message was sent over a gateway
  that doesn't exist — now honestly returns `NOT_IMPLEMENTED` /
  `NONE_CONFIGURED`.
- **`LogisticsOverviewPage.tsx`** — the "Corridor Watchlist & Reroute
  Demands" panel was two fully hardcoded cards ("NH-27 Haflong Pass Corridor
  ... RISK 88%", "NH-29 Dimapur – Kohima Highway ... RISK 62%") rendered
  unconditionally regardless of any real state. Replaced with corridors
  derived from the real `apiService.getRouteGraph()` edge risk scores
  (`risk_score >= 40`), with an honest empty state when none are flagged.
- **`LogisticsReroutingPage.tsx`** — the "AI-Recommended Bypass Corridor"
  block showed a hardcoded route name (`v.suggested_bypass ||
  'SH-51 Umrangso Bypass Alternate'` — the backend never sets
  `suggested_bypass` on any vehicle, so this *always* fired) and a static
  fake analysis ("Reduces hazard exposure from 82% to 14%", "-45 mins vs
  standing delay") for every single candidate. Worse, on "Authorize", that
  fabricated route name was sent to the backend and permanently written into
  the vehicle's audit-trail notes as if it were a real operator decision.
  Rewired to call the real `apiService.planRoute()` Dijkstra planner per
  candidate vehicle and use its real distance/time/risk figures; the
  "Authorize Reroute Bypass" button is now disabled when the planner returns
  no viable alternate, instead of fabricating one.
- **`LogisticsRoutesPage.tsx`** — the route-planner result card read
  `rt.total_time_hr` and `rt.max_risk`, but the backend's actual field names
  are `estimated_time_hr` and `max_segment_risk` (see
  `routing_service._summarize_path`). This field-name mismatch meant "peak
  corridor risk" silently showed a fake `18/100` for every single computed
  route, and estimated time showed blank. Fixed both field names. Also
  changed the corridor table's `c.risk_score || 20` fallback to `?? 0`
  (the `||` form would have masked a legitimate `0` risk score too, though
  in practice the field is always populated by the backend).
- **`LogisticsJourneysPage.tsx`** — `v.segment_progress || 0.35`: since a
  vehicle's progress is genuinely `0.0` (falsy) at the start of every trip
  leg, `||` silently replaced real 0% progress with a fake 35% on every
  fresh leg. Changed to `??`.
- **`LogisticsFleetPage.tsx`** — showed a fuel-level readout (`v.fuel ? ...
  : '85%'`) for every vehicle; the backend has no fuel field anywhere in
  `vehicle_service.py`, so this was a hardcoded `85%` shown as if real for
  100% of vehicles. Removed the fuel readout entirely (no real data source
  exists for it). Also tidied dead `speed`/`cargo` fallback chains to prefer
  the real field and fall back to `'N/A'`/`'Unknown'` instead of a plausible
  specific value (e.g. `'Medicines'`).
- **`LogisticsNotificationsPage.tsx`** — read `m.recipient`, `m.name`,
  `m.phone`, `m.timestamp`, none of which exist on the real outbox record
  (`notify_service.py` produces `to`, `body`, `created_at`). Every dispatched
  message therefore showed a fake name ("Driver / Dispatch"), fake phone
  ("+91-Regional"), and fake timestamp ("Just now") regardless of the real
  record. Fixed all field names to match the backend, and removed a
  `m.status || 'SENT'` default that would claim "SENT (TWILIO)" even when
  status was genuinely unknown.
- **`LogisticsWarehousesPage.tsx`** — labeled `DataProvenanceBadge
  kind="LIVE"`, but `warehouse_service.py`'s `WAREHOUSES` dict is static,
  hand-authored fixture data that never changes at runtime — its
  `update_warehouse_stock()` function exists but is never called from
  anywhere. Per this project's own provenance-badge contract (`SIMULATED`
  = "backed by the in-memory simulation/demo engine, not physical
  infrastructure"), this is a `SIMULATED` panel, not `LIVE`. Corrected the
  badge and subtitle copy.
- **`LogisticsDeliveriesPage.tsx`** — replaced specific fake place-name
  fallbacks (`'Silchar Civil Hospital'`, `'Guwahati Hub'`) with neutral
  `'Unknown'` (dead code in practice since the backend always populates
  these fields, but a plausible-place-name fallback is exactly the pattern
  the audit mandate forbids).
- **`ShipmentsView.tsx`** — the "Critical Shipment Highlight" banner was
  hardcoded and rendered unconditionally: `"SHP-9081: Emergency Medical
  Oxygen Cylinders ... NER-07 ... Civil Hospital Silchar ... +4h (Haflong
  Pass Blockage)"`, regardless of whether any such shipment existed. Now
  derived from real vehicle/cargo data (a genuinely critical + at-risk/
  delayed shipment), and hidden entirely when none exists. Also removed a
  fabricated constant `delayHours: 2.5` that was shown for every delayed
  shipment regardless of its real delay.
- **`IncidentImpactModal.tsx`** *(dead code — not imported/rendered
  anywhere in the app)* — on any non-200 response from an unauthenticated
  `fetch('http://localhost:8080/...')`, this component substituted an
  extremely detailed fabricated "AI Intelligence Recommendation": invented
  driver names ("Bikash Gogoi", "Lalthan Mawia"), invented ETAs, an invented
  87%/88% confidence score, and five invented "reasoning bullets" — all
  presented with zero indication of being fake. Rewired to call the real,
  authenticated `apiService.getIncidentImpactChain()` and show an honest
  loading/error/empty state instead. Left as dead code (not wired into any
  parent) since reconnecting it is rebuild-adjacent work out of this pass's
  scope, but it can no longer mislead a future integrator.
- **`SupplyGapIntelligencePanel.tsx`** *(dead code — not imported/rendered
  anywhere)* — same pattern: on any fetch failure it fabricated a full fake
  supply-gap scenario (district, oxygen cylinder counts, NER-07 convoy,
  projected shortage hours, confidence score). Rewired to only ever render
  real backend fields (`district`, `commodities`, `max_corridor_risk`,
  `incoming_shipments_count`, `warehouse_stock_feed`, `stock_quantity`,
  `unit`, `consumption_rate_per_hr`), with an honest error state on failure
  and no fallback fabrication. Removed a hardcoded "View Shipment
  (SHP-9081)" button that referenced a shipment that doesn't exist.

### Tests

- Added 4 new backend pytest regression tests
  (`backend/tests/test_auth.py`): `/api/risk/model-info` requires auth;
  `/api/sensors` and `/api/sensors/{node_key}` require auth; `/api/vehicles`
  requires auth; and a dedicated regression test asserting
  `/api/vehicles/me` never again fabricates a default assignment for an
  unmatched identity.
- Updated the pre-existing `test_model_info_exposes_real_metrics_...` test
  to authenticate (it previously asserted 200 for an anonymous call, which
  was itself evidence of the missing-auth bug).

## Partial (reviewed, deliberately left as-is, with reasoning)

- **`backend/app/routers/routes.py`, `dashboard.py`, `vehicles.py`
  (`list_vehicles`)** — these require authentication but not role
  restriction beyond "any logged-in user." Verified this is load-bearing,
  not an oversight: `DashboardPage.tsx` unconditionally calls
  `apiService.getVehicles()` / `getSensors()` for Emergency Operator, Field
  Officer, and Driver dashboards too (shared tactical map). Restricting
  these to Logistics-Operator/Admin only would break those three other
  role's map views, and auditing every other role's tab visibility to
  determine what's safe to restrict is out of this pass's scope. Corrected
  `list_vehicles`'s docstring, which falsely claimed the endpoint was
  "Restricted for OPERATOR & ADMIN roles" when it never was. **Remaining
  concern**: every authenticated role, including Driver, can currently list
  every other driver's phone number via this endpoint — a real but
  lower-severity PII exposure, documented here rather than silently fixed
  given the cross-role dependency above.
- **Reroute workflow** — the connected, user-facing Reroute Decisions page
  is now honest (real planner-computed alternates, no fabricated analysis),
  but it is a thin wrapper over the FastAPI `delivery-status` endpoint, not
  a durable "reroute request/approval" record the way the orphaned Java
  `RerouteOrder` entity was designed to be. There is also no automated
  mechanism anywhere that proactively creates a reroute proposal when a
  corridor's risk crosses a threshold — the operator must open the page and
  the frontend computes a candidate list from current vehicle status on
  demand. This is a real product gap, not a false-data issue.

## Remaining (genuine, undisguised limitations)

- **`LogisticsOperatorDashboardController.java`** — 100% hardcoded literals
  (`activeConvoys: 5`, `pendingReroutes: 1`, a fixed incident list), no
  repository call at all. `BLOCKED → REASON: orphaned endpoint, not called
  by any frontend code (confirmed) → IMPACT: none today; would mislead if
  ever wired up → REQUIRED NEXT STEP: either delete this controller or
  implement it against real repositories before it is ever linked to a UI.`
- **`ShipmentController.analyzeLogisticsImpact` (Java)** — properly secured
  (`@PreAuthorize`) but returns fully hardcoded impact figures
  (`affectedVehiclesCount(4)`, fixed recommendation text) regardless of the
  `{code}` path parameter. `BLOCKED → REASON: orphaned endpoint, same as
  above → IMPACT: none today → REQUIRED NEXT STEP: compute from real
  `ShipmentRepository`/corridor state, or remove.`
- **`SupplyGapAnalysisService.java`** — almost entirely hardcoded fixture
  data (fixed districts, quantities, consumption rates, ETAs, confidence
  scores 0.88/0.82/0.75/0.99); only the incident type is read from real
  state. `BLOCKED → REASON: orphaned service, confirmed not called by the
  frontend (which uses the separate, real Python `/api/supply-gaps/
  intelligence` implementation instead) → IMPACT: none today → REQUIRED
  NEXT STEP: either delete this Java module's supply-gap feature or rebuild
  it against real data before wiring it to anything.`
- **`LiveSensorsPanel.tsx` / `VehicleIntelligencePanel.tsx`** — contain
  `mockSensors` / `VEHICLE_ROUTES` (from `data/mockData`) respectively.
  Confirmed orphaned (not imported anywhere). `BLOCKED → REASON: out of
  this pass's time budget once confirmed unreachable → IMPACT: none today
  → REQUIRED NEXT STEP: delete or rebuild against real services before
  reconnecting.`
- **`FieldOfficerDashboardView.tsx` fabricated upload hash** — found during
  the repo-wide sweep; fabricates a fake SHA-256 (`mockHash`) as photo-upload
  proof. This is a **Field Officer** workflow, not Logistics Operator, and
  is out of this pass's scope by the task's own boundary. Flagged for a
  future Field Officer-focused audit pass; not touched here.
- **Java core-service test coverage** — no dedicated test class exists for
  `RerouteOrderController`/`RerouteOrderService`; the fixes in this pass were
  verified by full-suite compile + the existing 67 Java tests (all pass, no
  regressions) but not by a new targeted test, since the module is
  unreachable from the running app and adding test infrastructure for a
  disconnected module was judged lower priority than the live-path Python
  test additions above.

## Verification

- **Python**: `.venv/Scripts/python.exe -m pytest backend/tests` →
  **19 passed**, 0 failed (4 new, 1 updated).
- **Java**: `mvn -o clean compile` → **BUILD SUCCESS** (175 source files,
  clean recompile). `mvn -o test` → **67 tests run, 0 failures, 0 errors**
  across all existing suites (Admin/Driver/EmergencyOperator/FieldOfficer/
  LogisticsOperator governance, RBAC, SOS, recovery, tracking, etc.) — no
  regressions from the `RerouteOrderController`/`Service` changes.
- **Frontend**: `npm run lint` → clean, 0 errors/warnings introduced.
  `npm run build` → succeeds (`vite build`, 1923 modules transformed). Note:
  this project has no `tsc`-based typecheck script and TypeScript is not
  installed as a local dependency, so full type-checking beyond esbuild's
  transpile-time checks and the IDE's live diagnostics was not available in
  this environment; this is a pre-existing project condition, not something
  introduced or fixed in this pass.
- **Manual data-flow check**: cross-referenced every frontend field name
  touched in this pass against the actual backend response shape it reads
  from (`vehicle_service.VEHICLES`, `routing_service._summarize_path`,
  `notify_service._record`, `warehouse_service.WAREHOUSES`,
  `intelligence.py`'s two computed endpoints) rather than assuming the
  original implementation's field names were correct — this is how the
  `total_time_hr`/`max_risk` and notifications `recipient`/`phone`/
  `timestamp` mismatches were caught.

## Data Trust Matrix

| Capability | Status | Notes |
|---|---|---|
| Fleet / vehicle telemetry | **SIMULATED** | Real backend physics-style simulation (`vehicle_service.py`), consistently computed and honestly labeled in the UI; not physical GPS hardware. |
| Deliveries | **LIVE** | Real state transitions via authenticated FastAPI endpoints (`delivery-status`, `delivery-confirm`), identity taken from the JWT, not the client body. |
| Routing (corridor planner) | **LIVE** | Real NetworkX Dijkstra computation over live risk-weighted graph state (`routing_service.py`); no fabricated figures remain after this pass's fixes. |
| Rerouting | **LIVE, with a documented gap** | The connected UI flow now uses only real planner output (no fabricated bypass names/percentages). No automatic reroute-proposal trigger exists yet — operator-initiated only. The disconnected Java `RerouteOrder` subsystem remains unreachable and not a substitute. |
| Warehouses | **SIMULATED** | Static in-memory fixture data (`warehouse_service.py`); badge corrected from LIVE to SIMULATED this pass. Numbers are internally consistent (stock/threshold math is real arithmetic) but never change at runtime. |
| Supply intelligence | **LIVE (blended with simulated warehouse fixtures)** | District-level gap computation (`intelligence.py`) is genuinely recomputed per request from live vehicle/incident/sensor state; the warehouse enrichment portion draws on the static fixtures above. |
| Incidents | **LIVE** | Backed by `reports_service.REPORTS`; impact-chain endpoint computes affected corridors/vehicles/shipments dynamically per incident. |
| Notifications | **LIVE / SIMULATED (self-labeled per message)** | `notify_service.py` honestly tags each message `SENT`, `SIMULATED`, or `QUEUED_OFFLINE` depending on real Twilio credential presence and delivery outcome; frontend now reads the real field names instead of always defaulting to a fake "SENT (TWILIO)". |
| Telemetry (sensors) | **SIMULATED** | `simulation_service.py`'s tick engine; now properly requires authentication (previously public). |
| Java core-service (reroute/dashboard/supply-gap) | **NOT REACHABLE** | Confirmed orphaned — not started by `start.bat`, not called by the frontend. Contains real, uncorrected fabricated-data defects (documented above) but poses no live risk today. |

## Final Completion Checklist

- [x] No critical fake operational data remains *in the reachable app* (see Remaining for orphaned-code exceptions)
- [x] No silent fake fallbacks remain in the live Logistics Operator path
- [x] Authentication enforced on previously-public risk/sensor endpoints
- [x] Authorization enforced on the Java reroute-approval endpoints
- [x] Logistics Operator permissions correct where checked (`ROUTE_APPROVE`/`DECISION_APPROVE`/`EMERGENCY_CORRIDOR_MANAGE`)
- [x] Fleet workflow verified end-to-end (API → simulation → UI, honestly labeled)
- [x] Delivery workflow verified (status update → confirm, identity from JWT)
- [x] Routing workflow verified (real Dijkstra planner, field-name bug fixed)
- [x] Rerouting workflow repaired (fabrication removed); automation gap documented, not hidden
- [x] Supply workflow verified where implemented; warehouse badge corrected
- [x] Incident workflow verified (impact-chain endpoint, dead-code modal repaired)
- [x] Frontend/backend field-name contracts checked against actual source, 3 mismatches found and fixed
- [x] Empty states verified (EmptyState/ErrorState used consistently across new pages)
- [x] Error states verified (all pages have loading/error branches)
- [x] Simulation clearly labeled (DataProvenanceBadge corrected where wrong)
- [x] Backend tests run — 19/19 pass
- [x] Java tests run — 67/67 pass
- [x] Frontend lint run — clean
- [x] Frontend build run — succeeds
- [x] Documentation updated (this file)
