# 🎯 NER LogiSense — Resource Scoping, IDOR Rules & Security Architecture

> **System Name**: NER LogiSense — AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region  
> **Repository Root**: `e:\My projects\SIH-REPO`  
> **Source of Truth Document**: `docs/architecture/RESOURCE_SCOPE.md`  
> **Status**: APPROVED AUTHORITATIVE SPECIFICATION  

---

# 1. SCOPE TYPE FORMAL DEFINITIONS

To prevent horizontal data leaks (IDOR) and unauthorized spatial data access, NER LogiSense defines 5 explicit Scope Types:

1. **`GLOBAL`**: Unrestricted read/write capability across all 8 North Eastern Region states, 120+ districts, all system users, devices, and data records. (Restricted strictly to `ADMIN`).
2. **`DISTRICT`**: Access bounded by assigned operational district boundaries (e.g. Kamrup Metro, Dima Hasao, Cachar, East Khasi Hills). Enforces spatial filtering on incidents, emergency resources, and road closures (`EMERGENCY_OPERATOR`).
3. **`ASSIGNED`**: Access restricted to specific operational entities (tasks, inspection sites, incidents) explicitly assigned to the user's ID (`FIELD_OFFICER`).
4. **`SELF`**: Access strictly restricted to resources owned by or assigned to the authenticated user account (`DRIVER`).
5. **`RESOURCE-SCOPED`**: Access granted only when an explicit, verified relationship exists between the authenticated session and the entity (e.g., Logistics Operator $\rightarrow$ Managed Fleet; Driver $\rightarrow$ Assigned Vehicle/Shipment).

---

# 2. ENTITY GOVERNANCE MATRIX

| Entity Name | Primary Owner | Creator | Permitted Readers | Editors | Approvers | Resolvers | Deleters | Audit Authority | Scope Boundary |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`User`** | System Admin | Admin | Admin | Admin | Admin | N/A | Admin | Admin | `GLOBAL` |
| **`Vehicle`** | Fleet Depot | Logistics Op | Admin, Emer Op, Log Op, Driver (Self) | Log Op, Admin | Log Op | N/A | Admin | Admin | `FLEET` / `SELF` |
| **`Driver`** | Driver User | Admin | Admin, Log Op, Driver (Self) | Driver (Self), Admin | Log Op | N/A | Admin | Admin | `SELF` / `FLEET` |
| **`Shipment`** | Supply Depot | Logistics Op | Admin, Emer Op, Log Op, Driver (Self) | Log Op, Driver (Status) | Log Op | N/A | Admin | Admin | `FLEET` / `SELF` |
| **`Route`** | GIS Engine | Risk Engine | Admin, Emer Op, Log Op, Field Off, Driver | Log Op (Reroute) | Log Op, Admin | N/A | Admin | Admin | `FLEET` / `SELF` |
| **`Incident`** | Field / Driver | Field Off, Driver | Admin, Emer Op, Log Op, Field Off | Field Off, Emer Op | Emer Op, Admin | Emer Op, Admin | Admin | Admin | `DISTRICT` / `ASSIGNED` |
| **`SOS`** | Driver | Driver | Admin, Emer Op, Log Op (View), Driver (Self) | Emer Op (Dispatch) | Emer Op, Admin | Emer Op, Admin | Admin | Admin | `DISTRICT` / `SELF` |
| **`Field Report`** | Field Officer | Field Off | Admin, Emer Op, Log Op, Field Off | Field Off (Draft) | Emer Op | N/A | Admin | Admin | `ASSIGNED` |
| **`Field Task`** | Control Room | Emer Op, Admin | Admin, Emer Op, Field Off (Assigned) | Field Off (Progress) | Emer Op | Emer Op | Admin | Admin | `ASSIGNED` |
| **`Sensor`** | IoT Network | Admin | Admin, Log Op, Emer Op | Admin | Admin | N/A | Admin | Admin | `GLOBAL` / `DISTRICT` |
| **`Sensor Reading`**| Telemetry Node | Sensor Node | Admin, Log Op, Emer Op, Field Off | System | System | N/A | Admin | Admin | `GLOBAL` / `DISTRICT` |
| **`Road Corridor`** | Highway Auth | GIS Import | Admin, Emer Op, Log Op, Field Off, Driver | Emer Op, Admin | Emer Op, Admin | N/A | Admin | Admin | `GLOBAL` / `DISTRICT` |
| **`Road Status`** | Control Room | Emer Op, Field Off | Admin, Emer Op, Log Op, Field Off, Driver | Emer Op, Field Off | Emer Op | Emer Op | Admin | Admin | `DISTRICT` |
| **`Risk Assessment`**| AI Engine | Risk Model | Admin, Emer Op, Log Op | Admin (Override) | Emer Op, Admin | N/A | Admin | Admin | `GLOBAL` / `DISTRICT` |
| **`Warehouse`** | ERP System | Admin, Log Op | Admin, Log Op, Emer Op | Log Op, Admin | Log Op | N/A | Admin | Admin | `FLEET` / `DISTRICT` |
| **`Inventory`** | Warehouse | ERP Feed | Admin, Log Op, Emer Op | Log Op, Admin | Log Op | N/A | Admin | Admin | `FLEET` / `DISTRICT` |
| **`Alert`** | Notification | Alert Engine | Admin, Emer Op, Log Op, Field Off, Driver | Control Room | Control Room | Control Room | Admin | Admin | `DISTRICT` / `SELF` |
| **`Notification`** | System | Notify Engine| Recipient User | System | System | N/A | Admin | Admin | `SELF` |
| **`Audit Log`** | Security Core | Security Filter| Admin | None (Immutable) | None | None | None | Admin | `GLOBAL` (Immutable) |
| **`ML Model`** | ML Engine | Admin | Admin | Admin | Admin | N/A | Admin | Admin | `GLOBAL` |
| **`ML Prediction`**| ML Inference | Model Runner | Admin, Log Op, Emer Op | System | System | N/A | Admin | Admin | `GLOBAL` / `DISTRICT` |
| **`ML Detour Rec`** | AI Engine | Route Planner | Admin, Log Op | Log Op | Log Op, Admin | Log Op | Admin | Admin | `FLEET` |

---

# 3. IDOR & HORIZONTAL AUTHORIZATION ENFORCEMENT MODEL

To eliminate Insecure Direct Object Reference (IDOR) vulnerabilities, resource access MUST NEVER be authorized based solely on role existence (`if role == "DRIVER": allow`). 

All data queries MUST enforce **Role Permission + Resource Scoping Ownership Check**:

```
                       IDOR HORIZONTAL SECURITY EVALUATION PIPELINE

 [Incoming API Request] ──► [Verify JWT Signature & Expiry]
                                        │
                                        ▼
                       [Check Layer 2 Granular Permission]
                                        │
                                        ▼
                       [Check Layer 3 Resource Data Ownership]
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
         ▼                              ▼                              ▼
  DRIVER SCOPE:                  FIELD OFFICER SCOPE:           EMERGENCY OPERATOR SCOPE:
  `resource.driver_id            `task.assigned_officer_id      `incident.district_id
   == jwt.sub`                    == jwt.sub`                    == jwt.district_id`
         │                              │                              │
         └──────────────────────────────┼──────────────────────────────┘
                                        │
                                        ▼
                          [Access Granted / 403 Forbidden]
```

### Resource Ownership Checks by Endpoint Domain

1. **Driver Vehicle Telemetry (`GET /api/vehicles/me`, `GET /api/driver/vehicle/{id}`)**:
   $$\text{Vehicle.assigned\_driver\_id} == \text{JWT.sub} \quad \lor \quad \text{JWT.role} == \text{'ADMIN'}$$
2. **Driver Shipment Manifest (`GET /api/driver/shipments/{id}`)**:
   $$\text{Shipment.assigned\_driver\_id} == \text{JWT.sub} \quad \lor \quad \text{JWT.role} \in \{\text{'ADMIN'}, \text{'LOGISTICS\_OPERATOR'}\}$$
3. **Field Officer Task Management (`POST /api/reports/tasks/{id}/status`)**:
   $$\text{FieldTask.assigned\_officer\_id} == \text{JWT.sub} \quad \lor \quad \text{JWT.role} == \text{'ADMIN'}$$
4. **Emergency District SOS (`POST /api/sos/{id}/dispatch`)**:
   $$\text{SOS.district\_id} == \text{JWT.district\_id} \quad \lor \quad \text{JWT.role} == \text{'ADMIN'}$$
5. **Logistics Fleet Management (`POST /api/vehicles/{id}/delivery-confirm`)**:
   $$\text{Vehicle.fleet\_id} == \text{JWT.assigned\_fleet\_id} \quad \lor \quad \text{JWT.role} == \text{'ADMIN'}$$

---

# 4. HIGH-RISK ACTIONS & AUDIT CONTROL TABLE

| High-Risk Action | Authorized Roles | Risk Level | Confirmation Required | Immutable Audit Required | Operational Justification |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ROUTE_REROUTE_APPROVE` | `LOGISTICS_OPERATOR`, `ADMIN` | **HIGH** | YES (Cost/Risk Modal) | YES | Modifies active convoy navigation across mountain passes. |
| `EMERGENCY_CORRIDOR_MANAGE` | `EMERGENCY_OPERATOR`, `ADMIN` | **CRITICAL** | YES (Incident Reference) | YES | Closes public highway; impacts regional essential transport. |
| `SOS_DISPATCH` | `EMERGENCY_OPERATOR`, `ADMIN` | **CRITICAL** | YES (Dispatch Unit Select)| YES | Mobilizes government NDRF/BRO emergency rescue assets. |
| `SOS_RESOLVE` | `EMERGENCY_OPERATOR`, `ADMIN` | **HIGH** | YES (Safety Checklist) | YES | Closes active emergency life-safety panic alert. |
| `DELIVERY_CONFIRM` | `LOGISTICS_OPERATOR`, `ADMIN` | **HIGH** | YES (Proof Receipt Modal)| YES | Final commercial delivery sign-off; updates financial records. |
| `MANUAL_RISK_OVERRIDE` | `EMERGENCY_OPERATOR`, `ADMIN` | **HIGH** | YES (Reason Input) | YES | Overrides AI risk model score for specific corridor. |
| `USER_SUSPEND` | `ADMIN` | **HIGH** | YES (Confirmation Modal) | YES | Revokes platform access for operational user. |
| `MODEL_DEPLOY` / `ROLLBACK` | `ADMIN` | **CRITICAL** | YES (Dual-Factor Auth) | YES | Replaces active AI risk inference model binary. |

---

# 5. AI / ML AUTHORITY MODEL & HUMAN-IN-THE-LOOP FLOW

NER LogiSense strictly separates **AI Predictions** from **Human Operational Authority**. AI engines provide intelligence recommendations; authorized human operators execute decisions.

```
                         HUMAN-IN-THE-LOOP AI DECISION PIPELINE

 [1. SENSE]        IoT Sensors + Drivers ──► Multi-Source Telemetry Ingestion
 [2. PREDICT]      Risk Engine           ──► Landslide Score & Time-to-Clearance
 [3. CORROBORATE]  Dempster-Shafer Engine ──► Sensor Telemetry + Field Evidence Fusion
 [4. DECIDE]       Human Operator        ──► Logistics Op / Emergency Op Reviews Rec
 [5. ACT]          Platform Gateway      ──► Dispatches Reroute Alert / Road Closure
 [6. CONFIRM]      Driver / Field Off    ──► Confirms Arrival / Ground Passability
 [7. LEARN]        ML Analytics          ──► Logs Decision Delta for Model Retraining
```

### Decision Authority Rules
1. **AI Route Recommendations**: AI calculates alternate routes based on road clearance predictions and thermal budgets. The AI **NEVER** automatically reroutes commercial trucks without `LOGISTICS_OPERATOR` approval.
2. **AI Precautionary Safety Warnings**: High-risk hazard advisories (*"⚠️ HIGH LANDSLIDE RISK"*) are auto-pushed to Driver units for immediate safety without human delay.
3. **Model Rollback**: Only `ADMIN` can trigger model rollbacks when prediction drift exceeds sensitivity thresholds.

---

# 6. DOMAIN SECURITY MODELS BY ROLE

### 6.1 DRIVER SECURITY MODEL
- **Access Boundary**: Bounded strictly by `SELF` and `RESOURCE-SCOPED` rules.
- **Forbidden Operations**: Driver A attempting `GET /api/vehicles/{driver_b_vehicle}`, `GET /api/sos/{driver_b_sos}`, or accessing system configuration yields an immediate **403 Forbidden**.
- **Data Abstraction**: Drivers receive actionable operational alerts, never raw sensor telemetry metrics.

### 6.2 FIELD OFFICER SECURITY MODEL
- **Access Boundary**: Bounded strictly by `ASSIGNED` inspection tasks and local district boundaries.
- **Forbidden Operations**: Field Officers cannot approve commercial convoy detours, modify ML risk models, or issue global road closures. They act as authoritative ground truth evidence providers.

### 6.3 LOGISTICS OPERATOR SECURITY MODEL
- **Access Boundary**: Bounded by `OPERATIONAL FLEET SCOPE` and assigned supply depots.
- **Forbidden Operations**: Logistics Operators cannot manage user accounts, alter system JWT secrets, or resolve emergency driver SOS panic signals (View-only for convoy situational awareness).

### 6.4 EMERGENCY OPERATOR SECURITY MODEL
- **Access Boundary**: Bounded by `REGIONAL SPATIAL SCOPE` (Assigned DDMA/Disaster District).
- **Forbidden Operations**: Emergency Operators cannot modify user identity registries, deploy ML models, or alter platform IT configurations. They hold exclusive command over SOS panic triage and emergency corridor closures.

### 6.5 ADMIN SECURITY MODEL
- **Access Boundary**: `GLOBAL` platform scope.
- **Forbidden Operations**: Administrative authority is separated from daily operational workflows. Admins oversee system health, identity lifecycle, security audit, and ML governance without cluttering operational dashboards with admin tools.
