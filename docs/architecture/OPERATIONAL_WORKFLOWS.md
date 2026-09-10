# 🔄 NER LogiSense — Operational Workflows & Role Interaction Contracts

> **System Name**: NER LogiSense — AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region  
> **Repository Root**: `e:\My projects\SIH-REPO`  
> **Document Version**: 2.0  
> **Status**: AUTHORITATIVE SOURCE OF TRUTH  

---

## 1. Operational Command Workflows

```
                                 OPERATIONAL WORKFLOW INTERVIEW
                                 
   [DRIVER]                    [FIELD_OFFICER]           [EMERGENCY_OPERATOR]       [LOGISTICS_OPERATOR]
      │                               │                           │                          │
      │ ─── 1. SOS Panic Trigger ───► │                           │                          │
      │    or Hazard Flag             │ ─── 2. Inspect Ground ──► │                          │
      │                               │      Truth & Evidence     │ ─── 3. Close Corridor ─► │
      │                               │                           │      & Dispatch Rescue    │ ─── 4. Reroute Convoy
      │ ◄──────────────────────────── │ ◄──────────────────────── │ ◄─────────────────────── │      & Confirm Delivery
```

---

## 2. Detailed Workflows by Role

### 2.1 Workflow 1: Emergency SOS & Rescue Dispatch
1. **Trigger**: `DRIVER` presses SOS Panic button on mobile/cab unit, transmitting GPS coordinates (`POST /api/driver/sos/trigger`).
2. **Alert Notification**: `EMERGENCY_OPERATOR` emergency radar highlights panic alert with red flashing marker.
3. **Ground Verification**: `EMERGENCY_OPERATOR` checks nearby `FIELD_OFFICER` tasks or requests photo verification.
4. **Corridor Closure**: If hazard presents immediate threat to other traffic, `EMERGENCY_OPERATOR` updates road risk score to 95.0, closing corridor segment (`POST /api/sensors/inject-storm` / road closure).
5. **Rescue Unit Dispatch**: `EMERGENCY_OPERATOR` dispatches NDRF, SDRF, or BRO emergency response team (`POST /api/sos/{id}/dispatch`).
6. **Resolution**: Rescue completed $\rightarrow$ `EMERGENCY_OPERATOR` marks SOS resolved (`POST /api/sos/{id}/resolve`).

---

### 2.2 Workflow 2: Incident Field Inspection & Evidence Verification
1. **Detection**: Satellite sensor or driver flags landslide / bridge washout.
2. **Assignment**: Field task auto-assigned to nearest `FIELD_OFFICER` (`GET /api/reports/assigned-tasks`).
3. **Ground Audit**: `FIELD_OFFICER` travels to location, captures timestamped & geotagged photos (`POST /api/reports`).
4. **Verification**: `EMERGENCY_OPERATOR` inspects officer report, verifies incident authenticity, and calculates downstream impact (`POST /api/reports/{id}/verify`).
5. **Impact Cascade**: Incident Impact Chain graph recalculates affected logistics routes.

---

### 2.3 Workflow 3: AI Route Detour & Logistics Rerouting
1. **Interruption Alert**: `LOGISTICS_OPERATOR` sees active corridor disruption on Logistics Command Center.
2. **Impact Analysis**: `LOGISTICS_OPERATOR` queries `/api/incidents/{id}/impact-chain` to view all threatened shipments.
3. **AI Route Recommendation**: AI engine evaluates alternate routes based on road clearance prediction, thermal budget, and cargo perishability (`GET /api/routes/plan`).
4. **Approval & Execution**: `LOGISTICS_OPERATOR` confirms detour. Revised turn-by-turn navigation is pushed to the assigned `DRIVER`'s vehicle unit.
5. **Delivery Completion**: `LOGISTICS_OPERATOR` or `DRIVER` executes final delivery confirmation (`POST /api/vehicles/{id}/delivery-confirm`).

---

### 2.4 Workflow 4: System Administration & Governance
1. **User Onboarding**: `ADMIN` creates and provisions user accounts with assigned canonical role (`POST /api/users`).
2. **Device Health**: `ADMIN` monitors telemetry sensor feeds, gateway connectivity, and device batteries (`GET /api/devices/telemetry`).
3. **Audit Trail Review**: `ADMIN` inspects system audit logs for security anomalies (`GET /api/audit-logs`).
4. **ML Governance**: If risk engine drift occurs, `ADMIN` triggers controlled model rollback (`POST /api/risk/model/rollback`).
