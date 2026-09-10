# 🔒 NER LogiSense — API Authorization & Endpoint Security Matrix

> **System Name**: NER LogiSense — AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region  
> **Repository Root**: `e:\My projects\SIH-REPO`  
> **Document Version**: 2.0  
> **Status**: AUTHORITATIVE SOURCE OF TRUTH  

---

## 1. Authentication & JWT Tokens

NER LogiSense uses JSON Web Tokens (JWT) for stateless API authentication.

### Token Claims Payload
```json
{
  "sub": "user_12345",
  "email": "operator.kamrup@logisense.ner.gov.in",
  "role": "EMERGENCY_OPERATOR",
  "district_id": "DIST_KAMRUP_METRO",
  "assigned_fleet_id": null,
  "iat": 1757270400,
  "exp": 1757356800
}
```

---

## 2. Master Endpoint & Authorization Matrix

| Endpoint URI | HTTP Method | Minimum Required Role | Layer 2 Permission Required | Layer 3 Data Scope Enforcement |
| :--- | :--- | :--- | :--- | :--- |
| `/api/users/**` | `GET`, `POST`, `PUT`, `DELETE` | `ADMIN` | `USER_MANAGE` | **Global** |
| `/api/audit-logs` | `GET` | `ADMIN` | `AUDIT_LOG_VIEW` | **Global** |
| `/api/health/system` | `GET` | `ADMIN` | `SYSTEM_HEALTH_VIEW` | **Global** |
| `/api/risk/model/rollback` | `POST` | `ADMIN` | `MODEL_ROLLBACK` | **Global** |
| `/api/sos` | `GET` | `EMERGENCY_OPERATOR`, `ADMIN` | `SOS_VIEW` | **Regional Spatial** (Admin: Global) |
| `/api/sos/{id}/dispatch` | `POST` | `EMERGENCY_OPERATOR`, `ADMIN` | `SOS_DISPATCH` | **Regional Spatial** |
| `/api/sos/{id}/resolve` | `POST` | `EMERGENCY_OPERATOR`, `ADMIN` | `SOS_RESOLVE` | **Regional Spatial** |
| `/api/reports/{id}/verify` | `POST` | `EMERGENCY_OPERATOR`, `ADMIN` | `INCIDENT_VERIFY` | **Regional Spatial** |
| `/api/incidents/{id}/impact-chain` | `GET` | `EMERGENCY_OPERATOR`, `LOGISTICS_OPERATOR`, `ADMIN` | `INCIDENT_VIEW` | **Regional / Fleet Spatial** |
| `/api/sensors/inject-storm` | `POST` | `EMERGENCY_OPERATOR`, `ADMIN` | `ROAD_STATUS_UPDATE` | **Regional Spatial** |
| `/api/vehicles` | `GET` | `LOGISTICS_OPERATOR`, `EMERGENCY_OPERATOR`, `ADMIN` | `VEHICLE_VIEW` | **Fleet / Regional Scope** |
| `/api/routes/plan` | `GET`, `POST` | `LOGISTICS_OPERATOR`, `ADMIN` | `ROUTE_VIEW` | **Fleet Scope** |
| `/api/supply-gaps/intelligence` | `GET` | `LOGISTICS_OPERATOR`, `EMERGENCY_OPERATOR`, `ADMIN` | `SUPPLY_GAP_VIEW` | **Fleet / Regional Scope** |
| `/api/warehouses` | `GET` | `LOGISTICS_OPERATOR`, `ADMIN` | `SUPPLY_GAP_VIEW` | **Fleet Scope** |
| `/api/vehicles/{id}/delivery-confirm` | `POST` | `LOGISTICS_OPERATOR`, `DRIVER` (self-assigned only) | `DELIVERY_CONFIRM` | **Fleet / Self-Scoped** |
| `/api/reports` | `POST` | `FIELD_OFFICER`, `DRIVER`, `EMERGENCY_OPERATOR`, `ADMIN` | `INCIDENT_REPORT` | **Assigned Task / Self-Scoped** |
| `/api/driver/vehicle/{id}` | `GET` | `DRIVER`, `LOGISTICS_OPERATOR`, `ADMIN` | `VEHICLE_VIEW` | **Self-Scoped** (`driver_id == user_id`) |
| `/api/driver/sos/trigger` | `POST` | `DRIVER` | `SOS_TRIGGER` | **Self-Scoped** (`driver_id == user_id`) |
| `/api/driver/alerts` | `GET` | `DRIVER` | `ALERT_VIEW` | **Self-Scoped Actionable Alerts Only** |

---

## 3. IDOR & Data Scoping Middleware Enforcement

To prevent Horizontal Privilege Escalation (IDOR):
1. **`DRIVER` APIs**: The backend validates that `request.path.vehicle_id` or `request.body.driver_id` strictly equals `jwt.sub`.
2. **`FIELD_OFFICER` APIs**: The backend checks that `task.assigned_officer_id == jwt.sub`.
3. **`LOGISTICS_OPERATOR` APIs**: Filter queries automatically append `WHERE fleet_id = jwt.assigned_fleet_id`.
4. **`EMERGENCY_OPERATOR` APIs**: Filter queries automatically append `WHERE district_id = jwt.district_id`.
