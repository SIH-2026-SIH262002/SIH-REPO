# 📖 NER LogiSense — Canonical 5-Role Model Specification

> **System Name**: NER LogiSense — AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region  
> **Repository Root**: `e:\My projects\SIH-REPO`  
> **Source of Truth Document**: `docs/architecture/ROLE_MODEL.md`  
> **Status**: APPROVED AUTHORITATIVE SPECIFICATION  

---

# 1. ARCHITECTURAL OVERVIEW & ROLE DISCOVERY ANALYSIS

During our comprehensive repository audit across Spring Boot (`backend/core-service`), FastAPI (`backend/app`), Node.js Auth Engine (`backend/auth-service`), React Web Dashboard (`apps/web-dashboard`), and Flutter Mobile Client (`apps/mobile-app`), seven role strings were identified across legacy schemas and router guards:

### Discovered Role Strings in Repository
1. `SUPER_ADMIN` (Found in `RegisterPage.tsx`, `AppRoutes.tsx`, `auth.py`, `auth.ts`)
2. `ADMIN` (Found in `UserRole.java`, `auth.py`, `SecurityConfig.java`, `RegisterPage.tsx`)
3. `DISTRICT_AUTHORITY` (Found in `RegisterPage.tsx`, `AppRoutes.tsx`, `auth.py`, `auth.ts`)
4. `EMERGENCY_OPERATOR` (Found in `UserRole.java`, `RbacSecurityTest.java`, `AppRoutes.tsx`)
5. `LOGISTICS_OPERATOR` (Found in `UserRole.java`, `RbacSecurityTest.java`, `AppRoutes.tsx`)
6. `FIELD_OFFICER` (Found in `UserRole.java`, `index.js`, `RegisterPage.tsx`, `AppRoutes.tsx`)
7. `DRIVER` (Found in `UserRole.java`, `MobileDriverController.java`, `RegisterPage.tsx`, `AppRoutes.tsx`)

### Role Normalization & Resolution

#### A. `DISTRICT_AUTHORITY` vs. `EMERGENCY_OPERATOR`
- **Repository Evidence**: In `backend/app/auth.py` (lines 96-98): `elif r in ("DISTRICT_AUTHORITY", "EMERGENCY_OPERATOR"): normalized.add("EMERGENCY_OPERATOR")`. In Spring Boot `UserRole.java`, `EMERGENCY_OPERATOR` contains permissions `SOS_DISPATCH`, `EMERGENCY_CORRIDOR_MANAGE`, `INCIDENT_VERIFY`, `INCIDENT_RESOLVE`.
- **Operational Reality**: `DISTRICT_AUTHORITY` describes *who owns/employs* the official; `EMERGENCY_OPERATOR` describes *what the person does inside the platform*.
- **Canonical Standardization**: `EMERGENCY_OPERATOR` is the sole canonical operational role. `DISTRICT_AUTHORITY` is classified as a legacy alias.

#### B. `SUPER_ADMIN` vs. `ADMIN`
- **Repository Evidence**: In `backend/app/auth.py` (lines 93-95): `if r in ("SUPER_ADMIN", "ADMIN"): normalized.add("ADMIN")`. In Spring Boot `UserRole.java`, `ADMIN` is defined as `EnumSet.allOf(Permission.class)`. `ADMIN` already possesses 100% of system permissions.
- **Architectural Decision**: `SUPER_ADMIN` is an implementation artifact / internal administrative privilege tier, **NOT** a 6th product role. It is completely removed from product UI dropdowns and navigation drawers. Any super-administrative capability operates internally under the `ADMIN` security umbrella.

---

# 2. THE CANONICAL FIVE-ROLE SPECIFICATION

---

# ADMIN

## Purpose
System governance, identity lifecycle management, security configuration, hardware telemetry integration health, and machine learning model lifecycle governance.

## Who This Role Represents
IT Administrators, Disaster System Operations Engineers, and Senior Governance Officers.

## Primary Responsibilities
- User account provisioning, role assignment, suspension, and reactivation.
- Security audit log inspection and IP threat tracking.
- System integration health monitoring (IoT sensors, GIS data pipelines, ERP feeds).
- Machine learning model drift evaluation, deployment, and rollback.
- Global risk threshold and system-wide parameter configuration.

## Normal Workflow
Review system health telemetry $\rightarrow$ Audit identity access logs $\rightarrow$ Inspect ML model drift scores $\rightarrow$ Onboard or suspend operational accounts $\rightarrow$ Manage system secrets and API integrations.

## Emergency Workflow
During severe natural disasters, monitor system load, scale gateway instances, configure failover API endpoints, and ensure high availability of emergency data pipelines.

## Information They Need
- Platform system health, CPU/memory telemetry, database connection pool stats.
- Security audit trails, failed login attempts, IP access logs.
- ML model versioning, feature weights, drift metrics, and training metrics.
- User registry, active JWT sessions, and role assignment matrices.

## Information They Should Not Need
- Personal driver communication notes (unless requested during security audit).
- Detailed commercial cargo trade invoice specifics.

## Actions They Can Perform
- Create, view, update, suspend, reactivate, or deactivate user accounts.
- Assign or modify user roles and operational district boundaries.
- Inspect complete system audit logs and export security reports.
- Deploy, evaluate, or trigger emergency rollback of ML risk models.
- Configure global risk engine sensitivity thresholds.

## Actions They Cannot Perform
- ❌ Act as the primary dispatcher for daily commercial logistics fleet movements.
- ❌ Issue operational field rescue dispatches as a substitute for DDMA/NDRF command protocol.

## Data Scope
`GLOBAL` (Unrestricted read and write access across all 8 NER states, all districts, and all system entities).

## High-Risk Actions
- `USER_SUSPEND` / `USER_DEACTIVATE` (Requires explicit administrative confirmation modal).
- `MODEL_ROLLBACK` / `MODEL_DEPLOY` (Requires mandatory change reason log).
- `SYSTEM_CONFIG_MANAGE` (Requires dual-factor re-authentication).

## Audit Requirements
Every administrative action must log: Actor User ID, Actor IP Address, Target Entity ID, Action Type, Timestamp, Change Summary, and HTTP Response Status.

---

# EMERGENCY_OPERATOR

## Purpose
Emergency disaster command and emergency response management across regional transport corridors.

## Who This Role Represents
District Disaster Management Authority (DDMA) Control Officers, SDRF/NDRF Emergency Dispatch Commanders, BRO (Border Roads Organisation) Control Room Operators.

## Primary Responsibilities
- Monitor real-time driver SOS panic radar signals.
- Triage driver breakdowns, accidents, and life-safety emergencies.
- Inspect and verify ground incident reports submitted by drivers and field officers.
- Execute emergency highway corridor closures and override corridor risk scores during landslides/floods.
- Dispatch NDRF, SDRF, BRO, or medical emergency response teams.
- Coordinate emergency supply relief movement and resolve active emergency SOS alerts.

## Normal Workflow
Monitor Emergency Radar Map $\rightarrow$ Inspect incoming road hazard warnings $\rightarrow$ Track high-risk corridor segments $\rightarrow$ Coordinate routine weather alert advisories.

## Emergency Workflow
Receive Driver SOS Panic Signal $\rightarrow$ Geolocate nearest field officer/rescue unit $\rightarrow$ Verify ground truth photo evidence $\rightarrow$ Override corridor risk score to 95.0 (Closed) $\rightarrow$ Dispatch NDRF/BRO emergency team $\rightarrow$ Mark SOS resolved upon safe extraction.

## Information They Need
- Active driver SOS panic locations, timestamps, driver contact details, and vehicle GPS coordinates.
- Real-time road blockage reports, landslide occurrences, bridge washouts, and photo evidence.
- Regional emergency resource locations (NDRF bases, BRO equipment, heavy recovery vehicles, emergency shelters).
- High-level status of commercial convoys trapped within disaster zones.

## Information They Should Not Need
- ❌ User password hashes, JWT signing keys, or database connection strings.
- ❌ ML model training source code or hyperparameter configuration files.
- ❌ Commercial cargo billing details or vendor invoice prices.

## Actions They Can Perform
- View, acknowledge, dispatch rescue teams for, and resolve emergency driver SOS panic alerts.
- Verify ground incident reports and calculate downstream incident impact chains.
- Update corridor status, execute emergency road closures, and override corridor risk scores.
- Coordinate emergency resource allocation across disaster districts.

## Actions They Cannot Perform
- ❌ Create, edit, suspend, or delete platform user accounts.
- ❌ Modify system security configurations or JWT expiration settings.
- ❌ Deploy or rollback machine learning risk models.
- ❌ Approve commercial shipment reroutes or confirm commercial freight deliveries.

## Data Scope
`DISTRICT` (Restricted to assigned operational district/state boundaries, e.g. Kamrup Metro, Dima Hasao, Cachar) and `EMERGENCY_VISIBILITY` (Read-only access to vehicles/shipments trapped within active disaster zones).

## High-Risk Actions
- `SOS_RESOLVE` (Requires confirmation that driver is safe and rescue team has verified extraction).
- `EMERGENCY_CORRIDOR_MANAGE` (Executing highway closures requires mandatory incident reference ID).
- `MANUAL_RISK_OVERRIDE` (Requires logged justification for manual risk score modification).

## Audit Requirements
All SOS acknowledgements, rescue dispatches, corridor closures, risk overrides, and SOS resolutions must be logged with: Operator User ID, Incident ID, District ID, Timestamp, Action Details, and Justification.

---

# LOGISTICS_OPERATOR

## Purpose
Continuous monitoring, route optimization, thermal budget protection, supply gap mitigation, and delivery execution for commercial and essential commodity logistics fleets.

## Who This Role Represents
Regional Logistics Control Room Managers, Essential Supply Chain Controllers, Fleet Operations Managers.

## Primary Responsibilities
- Monitor live GPS fleet position, speed, and heading across the North Eastern Region.
- Track cargo temperature, cold-chain thermal budget, and perishable cargo shelf-life decay.
- Inspect AI-recommended route detours when corridors are disrupted.
- Approve or reject vehicle rerouting recommendations based on transit time and cost-benefit trade-offs.
- Analyze district supply gap intelligence and prioritize essential food/medical shipments.
- Perform final delivery confirmations upon fleet arrival at destination depots.

## Normal Workflow
Inspect Logistics Command Center Dashboard $\rightarrow$ Track active fleet movements $\rightarrow$ Monitor cold-chain sensor telemetry $\rightarrow$ Review supply gap intelligence $\rightarrow$ Confirm completed deliveries.

## Emergency Workflow
Receive Corridor Interruption Alert $\rightarrow$ Inspect Incident Impact Chain for affected convoys $\rightarrow$ Trigger AI Route Planner $\rightarrow$ Evaluate alternate routes against landslide risks & thermal budgets $\rightarrow$ Approve route detour $\rightarrow$ Push updated navigation to driver cab unit.

## Information They Need
- Real-time GPS location, speed, telemetry, and fuel levels of managed fleet vehicles.
- Cold-chain cargo temperature feeds, thermal budget decay rates, and cargo priority flags.
- AI route recommendations, distance deltas, ETA estimates, and detour cost analyses.
- District supply gap analytics, warehouse stock feeds, and depot inventory levels.

## Information They Should Not Need
- ❌ User identity administration, password reset tools, or security audit logs.
- ❌ ML model binary deployment or system infrastructure settings.
- ❌ Secret disaster dispatch channels reserved for defense/NDRF command.

## Actions They Can Perform
- View fleet vehicles, active shipments, warehouse inventory levels, and supply gap reports.
- Request AI route optimizations, compare alternate routes, and approve vehicle reroutes.
- Update shipment lifecycle states and issue final commercial delivery confirmations.
- Export NDMA-compliant logistics summary PDF reports.

## Actions They Cannot Perform
- ❌ Manage user identity lifecycle, roles, or security credentials.
- ❌ Deploy or rollback machine learning risk models.
- ❌ Resolve emergency driver SOS panic signals (View-only for situational awareness).
- ❌ Officially verify field incident reports or close public highways.

## Data Scope
`RESOURCE-SCOPED` / `FLEET-SCOPED` (Access restricted to assigned logistics fleets, managed shipments, and authorized district supply hubs).

## High-Risk Actions
- `ROUTE_REROUTE_APPROVE` (Approving major convoy detours requires cost/risk verification).
- `DELIVERY_CONFIRM` (Final commercial delivery sign-off triggers inventory updates).

## Audit Requirements
All reroute approvals, detour overrides, shipment status changes, and delivery confirmations must log: Operator User ID, Vehicle ID, Shipment ID, Distance/Cost Delta, Timestamp, and Outcome.

---

# FIELD_OFFICER

## Purpose
On-ground physical inspection, hazard evidence collection, field task execution, and ground-truth verification across remote mountain corridors.

## Who This Role Represents
Ground Highway Patrol Officers, DDMA Field Inspectors, Local Disaster First Responders, BRO Field Supervisors.

## Primary Responsibilities
- Execute assigned field inspection tasks in response to sensor alerts or driver reports.
- Inspect physical road blockages, rockfalls, mudslides, and flooded bridge crossings.
- Capture multipart, timestamped, geotagged photo evidence using mobile camera modules.
- Update field task statuses (`ACKNOWLEDGED`, `IN_PROGRESS`, `COMPLETED`).
- Submit offline hazard reports when operating in cellular dead zones and sync when connectivity returns.

## Normal Workflow
View assigned inspection tasks $\rightarrow$ Travel to field location $\rightarrow$ Conduct physical inspection $\rightarrow$ Capture geotagged evidence photos $\rightarrow$ Submit inspection report $\rightarrow$ Mark task complete.

## Emergency Workflow
Deploy immediately to active landslide site $\rightarrow$ Assess passability for heavy relief trucks $\rightarrow$ Capture ground truth evidence $\rightarrow$ Flag segment as impassable $\rightarrow$ Upload evidence to trigger Emergency Operator verification.

## Information They Need
- Assigned field inspection task details, target GPS coordinates, and inspection instructions.
- Local corridor weather alerts, nearby sensor alert triggers, and recent driver hazard reports.
- Offline maps and local route accessibility status.

## Information They Should Not Need
- ❌ Global user identity registries or system security audit logs.
- ❌ Fleet-wide commercial cargo pricing or vendor financial agreements.
- ❌ Machine learning model hyperparameter configurations.

## Actions They Can Perform
- View assigned field inspection tasks and acknowledge task assignments.
- Create field hazard reports and upload geotagged binary photo evidence.
- Update field inspection task progress and mark field tasks completed.
- Submit road passability observations and sync offline reports.

## Actions They Cannot Perform
- ❌ Perform global system user management or role modifications.
- ❌ Approve commercial logistics fleet rerouting.
- ❌ Deploy or alter machine learning risk engines.
- ❌ Independently mark emergency driver SOS signals as resolved.
- ❌ Globally close national highway corridors (Provides evidence; Emergency Operator executes closure).

## Data Scope
`ASSIGNED` (Restricted to inspection tasks, incidents, and geographical zones explicitly assigned to the officer's ID or local district).

## High-Risk Actions
- `FIELD_EVIDENCE_UPLOAD` (Submitting evidence that alters corridor status requires geotag and device timestamp validation).

## Audit Requirements
All task status updates, evidence uploads, and field reports must log: Field Officer User ID, Task ID, GPS Coordinates, Timestamp, Device Fingerprint, and Upload Status.

---

# DRIVER

## Purpose
Safe execution of assigned logistics transit, vehicle operation, real-time telematics transmission, en-route hazard reporting, and emergency SOS panic trigger.

## Who This Role Represents
Commercial Freight Drivers, Essential Supply Tanker Operators, Relief Supply Truck Drivers.

## Primary Responsibilities
- Navigate assigned logistics routes safely using real-time accessibility advisories.
- Transmit GPS telematics, speed, and vehicle status updates.
- Report en-route road hazards (rockfalls, fallen trees, localized flooding) without declaring SOS.
- Trigger emergency SOS panic signal during vehicle breakdown, accident, or life-threatening emergency.
- Update delivery status (`IN_TRANSIT`, `DELAYED_LANDSLIDE`, `ARRIVED_DESTINATION`, `DELIVERED_PENDING_CONFIRMATION`).

## Normal Workflow
Log into Driver App $\rightarrow$ Inspect assigned vehicle & shipment $\rightarrow$ Start route navigation $\rightarrow$ Receive actionable hazard advisories $\rightarrow$ Update delivery status upon arrival.

## Emergency Workflow
Vehicle struck by landslide / breakdown on remote pass $\rightarrow$ Press 1-Tap SOS Panic Button $\rightarrow$ System transmits GPS, vehicle ID, and driver contact $\rightarrow$ Receive emergency instructions from Control Center $\rightarrow$ Await NDRF rescue.

## Information They Need
- Assigned vehicle details (license code, capacity, health).
- Assigned shipment details (origin, destination, cargo type, priority).
- Assigned route turn-by-turn navigation and detour instructions.
- Actionable en-route hazard alerts (*"⚠️ HIGH LANDSLIDE RISK — Road ahead unsafe. Recommended action: STOP / REROUTE"*).

## Information They Should Not Need
- ❌ Raw soil moisture %, slope instability index, or GBDT feature importance scores.
- ❌ Telemetry, position, speed, or SOS signals of OTHER drivers.
- ❌ Logistics control room analytics, user registries, or ML governance panels.

## Actions They Can Perform
- View self-assigned vehicle, assigned shipment, and assigned route navigation.
- Transmit vehicle telematics and update journey delivery status.
- Submit en-route hazard reports and upload hazard photos.
- Trigger self emergency SOS panic alerts and receive emergency control instructions.

## Actions They Cannot Perform
- ❌ View or modify any vehicle, shipment, or SOS record belonging to another driver (Strict IDOR Boundary).
- ❌ View system-wide fleet dashboards or logistics control analytics.
- ❌ Approve official route detours or modify system risk thresholds.
- ❌ Perform user management or security administration.

## Data Scope
`SELF` / `RESOURCE-SCOPED` (Access strictly restricted to resources where `assigned_driver_id == authenticated_user_id`).

## High-Risk Actions
- `SOS_TRIGGER` (Triggers high-priority emergency radar broadcast and rescue dispatch pipeline).

## Audit Requirements
All SOS triggers, hazard reports, and delivery status updates must log: Driver User ID, Vehicle ID, GPS Coordinates, Speed, Timestamp, and Response Status.
