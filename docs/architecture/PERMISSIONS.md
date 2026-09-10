# 🔑 NER LogiSense — Master Permission Vocabulary & Role × Permission Matrix

> **System Name**: NER LogiSense — AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region  
> **Repository Root**: `e:\My projects\SIH-REPO`  
> **Source of Truth Document**: `docs/architecture/PERMISSIONS.md`  
> **Status**: APPROVED AUTHORITATIVE SPECIFICATION  

---

# 1. CENTRALIZED PERMISSION VOCABULARY BY DOMAIN

All permissions in NER LogiSense are strictly defined within `com.ner.logistics.user.Permission` (Spring Boot Core Service) and enforced across the API gateway.

```
                                PERMISSION DOMAIN ARCHITECTURE
                                
 ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
 │   AUTHENTICATION  │   │  USER GOVERNANCE  │   │  FLEET & VEHICLES │   │     SHIPMENTS     │
 │   & IDENTITY      │   │  & RBAC           │   │  & TELEMATICS     │   │     & CARGO       │
 └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
           │                       │                       │                       │
 ┌─────────┴─────────┐   ┌─────────┴─────────┐   ┌─────────┴─────────┐   ┌─────────┴─────────┐
 │ ROUTING & AI      │   │ INCIDENTS & HAZARDS│   │ EMERGENCY SOS     │   │ FIELD OPERATIONS  │
 │ DECISIONS         │   │                   │   │ & DISPATCH        │   │ & EVIDENCE        │
 └───────────────────┘   └───────────────────┘   └───────────────────┘   └───────────────────┘
```

---

# 2. GRANULAR PERMISSION DEFINITIONS

---

### 2.1 Authentication & Identity Domain

#### PERMISSION: `AUTH_LOGIN`
- **Meaning**: Authenticate against identity provider and receive JWT access token.
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`, `LOGISTICS_OPERATOR`, `FIELD_OFFICER`, `DRIVER`
- **Scope**: `GLOBAL`
- **Risk**: `LOW`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `backend/auth-service/router/index.js` (`POST /api/auth/login`), `AuthController.java`

#### PERMISSION: `AUTH_PASSWORD_RESET`
- **Meaning**: Request and execute credential password resets.
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`, `LOGISTICS_OPERATOR`, `FIELD_OFFICER`, `DRIVER`
- **Scope**: `SELF`
- **Risk**: `MEDIUM`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `backend/auth-service/core/passwordReset.js`, `AuthController.java`

---

### 2.2 User Governance & System Administration Domain

#### PERMISSION: `USER_CREATE`
- **Meaning**: Provision new user accounts in the identity directory.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `HIGH`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `UserController.java` (`@PreAuthorize("hasAuthority('USER_MANAGE')")`), `RegisterPage.tsx`

#### PERMISSION: `USER_VIEW`
- **Meaning**: View user profiles, metadata, and active account registries.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `LOW`
- **Audit Required**: `NO`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `UserController.java` (`GET /api/users`)

#### PERMISSION: `USER_SUSPEND`
- **Meaning**: Temporarily suspend user account authentication privileges.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `HIGH`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `UserController.java` (`POST /api/users/{id}/suspend`), `JwtAuthFilter.java` (blocks suspended status)

#### PERMISSION: `USER_REACTIVATE`
- **Meaning**: Reactivate previously suspended user accounts.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `HIGH`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `UserController.java` (`POST /api/users/{id}/reactivate`)

#### PERMISSION: `USER_DEACTIVATE`
- **Meaning**: Permanently deactivate user access.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `CRITICAL`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `UserController.java` (`POST /api/users/{id}/deactivate`)

#### PERMISSION: `ROLE_MANAGE`
- **Meaning**: Assign or modify canonical roles for user accounts.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `CRITICAL`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `UserController.java` (`PUT /api/users/{id}/role`)

---

### 2.3 Fleet & Vehicles Domain

#### PERMISSION: `VEHICLE_VIEW`
- **Meaning**: View global or regional fleet vehicle positions, status, and health.
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`, `LOGISTICS_OPERATOR`
- **Scope**: `FLEET` / `DISTRICT`
- **Risk**: `LOW`
- **Audit Required**: `NO`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `VehicleController.java` (`GET /api/vehicles`), `vehicles.py`

#### PERMISSION: `VEHICLE_MANAGE`
- **Meaning**: Register, update, or decommission fleet vehicle assets.
- **Required Roles**: `ADMIN`, `LOGISTICS_OPERATOR`
- **Scope**: `FLEET`
- **Risk**: `MEDIUM`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `VehicleController.java` (`POST/PUT /api/vehicles`)

#### PERMISSION: `VEHICLE_VIEW_SELF`
- **Meaning**: View self-assigned vehicle details and telematics.
- **Required Roles**: `DRIVER`
- **Scope**: `SELF`
- **Risk**: `LOW`
- **Audit Required**: `NO`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `MobileDriverController.java` (`GET /api/driver/vehicle`), `vehicles.py` (`GET /api/vehicles/me`)

---

### 2.4 Shipments & Cargo Domain

#### PERMISSION: `SHIPMENT_VIEW`
- **Meaning**: View active logistics shipments, routes, and cargo manifests.
- **Required Roles**: `ADMIN`, `LOGISTICS_OPERATOR`
- **Scope**: `FLEET`
- **Risk**: `LOW`
- **Audit Required**: `NO`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `ShipmentController.java` (`GET /api/shipments`)

#### PERMISSION: `SHIPMENT_MANAGE`
- **Meaning**: Create, update, or assign logistics shipments.
- **Required Roles**: `ADMIN`, `LOGISTICS_OPERATOR`
- **Scope**: `FLEET`
- **Risk**: `MEDIUM`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `ShipmentController.java` (`POST /api/shipments`)

#### PERMISSION: `SHIPMENT_VIEW_SELF`
- **Meaning**: View self-assigned shipment manifest and destination details.
- **Required Roles**: `DRIVER`
- **Scope**: `SELF`
- **Risk**: `LOW`
- **Audit Required**: `NO`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `MobileDriverController.java` (`GET /api/driver/shipments`)

#### PERMISSION: `DELIVERY_STATUS_UPDATE`
- **Meaning**: Update journey progress (`IN_TRANSIT`, `DELAYED`, `ARRIVED`).
- **Required Roles**: `DRIVER`, `LOGISTICS_OPERATOR`
- **Scope**: `SELF` (Driver) / `FLEET` (Operator)
- **Risk**: `MEDIUM`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `ShipmentController.java`, `vehicles.py` (`POST /api/vehicles/{id}/delivery-status`)

#### PERMISSION: `DELIVERY_CONFIRM`
- **Meaning**: Issue final commercial delivery sign-off and complete shipment lifecycle.
- **Required Roles**: `ADMIN`, `LOGISTICS_OPERATOR`
- **Scope**: `FLEET`
- **Risk**: `HIGH`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `ShipmentController.java`, `vehicles.py` (`POST /api/vehicles/{id}/delivery-confirm`)

---

### 2.5 Routing & AI Decision Domain

#### PERMISSION: `ROUTE_VIEW`
- **Meaning**: View GIS route geometries, corridor accessibility scores, and alternative detours.
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`, `LOGISTICS_OPERATOR`, `FIELD_OFFICER`
- **Scope**: `GLOBAL` / `DISTRICT` / `FLEET`
- **Risk**: `LOW`
- **Audit Required**: `NO`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `RiskEngineService.java`, `intelligence.py` (`GET /api/routes/plan`)

#### PERMISSION: `ROUTE_VIEW_SELF`
- **Meaning**: View turn-by-turn navigation for self-assigned route.
- **Required Roles**: `DRIVER`
- **Scope**: `SELF`
- **Risk**: `LOW`
- **Audit Required**: `NO`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `MobileDriverController.java` (`GET /api/driver/route`)

#### PERMISSION: `ROUTE_APPROVE`
- **Meaning**: Approve AI-recommended vehicle reroute detours.
- **Required Roles**: `ADMIN`, `LOGISTICS_OPERATOR`
- **Scope**: `FLEET`
- **Risk**: `HIGH`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `ShipmentController.java`, `intelligence.py`

---

### 2.6 Incidents & Emergency SOS Domain

#### PERMISSION: `INCIDENT_REPORT`
- **Meaning**: Submit initial field road blockage or disaster incident report.
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`, `FIELD_OFFICER`
- **Scope**: `ASSIGNED` / `DISTRICT`
- **Risk**: `MEDIUM`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `IncidentController.java`, `reports.py` (`POST /api/reports`)

#### PERMISSION: `INCIDENT_VERIFY`
- **Meaning**: Confirm authenticity of reported incident and calculate downstream impact.
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`
- **Scope**: `DISTRICT`
- **Risk**: `HIGH`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `IncidentController.java` (`POST /api/reports/{id}/verify`)

#### PERMISSION: `SOS_TRIGGER`
- **Meaning**: Trigger high-priority emergency SOS panic signal with GPS coordinates.
- **Required Roles**: `DRIVER`, `ADMIN`, `EMERGENCY_OPERATOR`
- **Scope**: `SELF`
- **Risk**: `CRITICAL`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `SosController.java`, `sos.py` (`POST /api/driver/sos/trigger`)

#### PERMISSION: `SOS_ACKNOWLEDGE`
- **Meaning**: Mark emergency SOS as acknowledged by control room dispatcher.
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`
- **Scope**: `DISTRICT`
- **Risk**: `HIGH`
- **Audit Required**: `YES`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `SosController.java` (`POST /api/sos/{id}/acknowledge`)

#### PERMISSION: `SOS_DISPATCH`
- **Meaning**: Issue official rescue team dispatch (NDRF, BRO, SDRF).
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`
- **Scope**: `DISTRICT`
- **Risk**: `CRITICAL`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `SosController.java` (`POST /api/sos/{id}/dispatch`)

#### PERMISSION: `SOS_RESOLVE`
- **Meaning**: Mark driver emergency SOS as fully resolved after rescue extraction.
- **Required Roles**: `ADMIN`, `EMERGENCY_OPERATOR`
- **Scope**: `DISTRICT`
- **Risk**: `HIGH`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `SosController.java` (`POST /api/sos/{id}/resolve`)

---

### 2.7 ML Governance & System Infrastructure Domain

#### PERMISSION: `MODEL_VERSION_VIEW`
- **Meaning**: View ML model metadata, version history, and evaluation metrics.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `LOW`
- **Audit Required**: `NO`
- **Approval Required**: `NO`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `MlModelGovernanceController.java` (`GET /api/risk/model/versions`)

#### PERMISSION: `MODEL_DEPLOY`
- **Meaning**: Deploy new machine learning model binaries to active inference pipeline.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `CRITICAL`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `MlModelGovernanceController.java` (`POST /api/risk/model/deploy`)

#### PERMISSION: `MODEL_ROLLBACK`
- **Meaning**: Roll back risk engine model to previous baseline version.
- **Required Roles**: `ADMIN`
- **Scope**: `GLOBAL`
- **Risk**: `CRITICAL`
- **Audit Required**: `YES`
- **Approval Required**: `YES`
- **Current Implementation**: `IMPLEMENTED`
- **Backend Evidence**: `MlModelGovernanceController.java` (`POST /api/risk/model/rollback`)

---

# 3. MASTER ROLE × PERMISSION MATRIX

**Legend**:
- **`R`** = Read / View
- **`C`** = Create / Submit
- **`U`** = Update / Edit
- **`D`** = Delete / Remove
- **`A`** = Approve / Confirm
- **`E`** = Execute / Trigger
- **`S`** = Self-Only Scoped
- **`T`** = Assigned / Task Scoped
- **`X`** = Forbidden / Denied

| Permission | ADMIN | EMERGENCY_OPERATOR | LOGISTICS_OPERATOR | FIELD_OFFICER | DRIVER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`USER_MANAGE`** | C / R / U / D | X | X | X | X |
| **`ROLE_MANAGE`** | C / R / U / D | X | X | X | X |
| **`AUDIT_LOG_VIEW`** | R | X | X | X | X |
| **`MODEL_DEPLOY`** | C / E | X | X | X | X |
| **`MODEL_ROLLBACK`** | E | X | X | X | X |
| **`RISK_THRESHOLD_MANAGE`** | U / E | X | X | X | X |
| **`VEHICLE_VIEW`** | R | R | R | R | S |
| **`VEHICLE_MANAGE`** | C / U / D | X | C / U | X | X |
| **`SHIPMENT_VIEW`** | R | R | R | X | S |
| **`SHIPMENT_MANAGE`** | C / U / D | X | C / U | X | X |
| **`ROUTE_PLAN`** | E | E | E | X | X |
| **`ROUTE_APPROVE`** | A / E | X | A / E | X | X |
| **`DELIVERY_STATUS_UPDATE`** | U | X | U | X | S / U |
| **`DELIVERY_CONFIRM`** | A / E | X | A / E | X | X |
| **`INCIDENT_REPORT`** | C | C | X | C / T | X |
| **`INCIDENT_VERIFY`** | A / E | A / E | X | T (Evidence) | X |
| **`EMERGENCY_CORRIDOR_MANAGE`** | E | E | X | X | X |
| **`SOS_TRIGGER`** | E | E | X | E | S / E |
| **`SOS_ACKNOWLEDGE`** | E | E | X | X | X |
| **`SOS_DISPATCH`** | E | E | X | X | X |
| **`SOS_RESOLVE`** | A / E | A / E | X | X | X |
| **`FIELD_TASK_UPDATE`** | U | X | X | T / U | X |
| **`ROAD_HAZARD_FLAG_SELF`** | C | C | X | C | S / C |
| **`SUPPLY_GAP_VIEW`** | R | R | R | X | X |
| **`REPORT_EXPORT`** | E | E | E | X | X |
