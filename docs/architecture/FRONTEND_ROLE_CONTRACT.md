# 🎨 NER LogiSense — Frontend Role Contract & UI Navigation Specification

> **System Name**: NER LogiSense — AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region  
> **Repository Root**: `e:\My projects\SIH-REPO`  
> **Source of Truth Document**: `docs/architecture/FRONTEND_ROLE_CONTRACT.md`  
> **Status**: APPROVED AUTHORITATIVE SPECIFICATION  

---

# 1. FRONTEND ROLE ROUTING & NAVIGATION MATRIX

The React web application (`apps/web-dashboard`) and mobile driver client (`apps/mobile-app`) enforce strict role-based view routing, navigation drawer visibility, and dashboard page access.

```
                    CANONICAL FRONTEND ROUTE GUARDING ARCHITECTURE

 [User Login] ──► [Auth Context] ──► Read user.role ──► [ProtectedRoute Guard]
                                                              │
         ┌───────────────────┬───────────────────┬────────────┴──────┬───────────────────┐
         │                   │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼                   ▼
     `/admin`           `/emergency`        `/logistics`          `/field`           `/driver`
      (ADMIN)       (EMERGENCY_OPERATOR) (LOGISTICS_OPERATOR)  (FIELD_OFFICER)       (DRIVER)
```

---

# 2. ROLE-BY-ROLE FRONTEND UI CONTRACTS

---

## 2.1 ROLE: `ADMIN`

- **Default Route**: `/admin`
- **Navigation Bar Items**:
  - Admin Governance (`/admin`)
  - User Identity Registry (`/admin/users`)
  - Security Audit Logs (`/admin/audit-logs`)
  - ML Governance & Drift (`/admin/ml-governance`)
  - IoT & Telemetry Device Health (`/admin/device-health`)
- **Dashboard Widgets**: Platform System Health, Active User Sessions, Security Audit Feed, ML Model Version & Drift Score, Database Connection Pool Telemetry.
- **Pages**:
  - `AdminGovernancePage.tsx`
  - `UserManagementPage.tsx`
  - `AuditLogViewerPage.tsx`
  - `MlGovernancePage.tsx`
  - `DeviceHealthPage.tsx`
- **Tables**: Registered User Accounts, System Security Audit Trail, ML Model Deployments & Rollbacks, Device Telemetry Status.
- **Maps**: Global System Node Status Map (Read-only infrastructure view).
- **Primary Actions**:
  - Provision operational user account
  - Edit user role and assigned district
  - Suspend or reactivate user account
  - Trigger ML model rollback
- **Secondary Actions**: Export security audit CSV, configure global risk sensitivity thresholds, inspect API integration health.
- **Alerts**: System health warnings, failed authentication threshold spikes, ML model drift alerts.
- **Notifications**: Security breach warnings, system update announcements.
- **Reports**: System Audit Summary Report, Identity Lifecycle Audit.
- **Settings**: Security Config, JWT Secrets Configuration, Database Parameters.

---

## 2.2 ROLE: `EMERGENCY_OPERATOR`

- **Default Route**: `/emergency`
- **Navigation Bar Items**:
  - Emergency Command (`/emergency`)
  - Live SOS Radar (`/emergency/sos-radar`)
  - Incident Verification (`/emergency/incidents`)
  - Highway Corridor Closures (`/emergency/corridors`)
  - Regional Emergency Resources (`/emergency/resources`)
- **Dashboard Widgets**: Emergency SOS Panic Feed, Active Landslide/Flood Blockages, Emergency Resource Fleet Status, High-Risk Corridor Radar.
- **Pages**:
  - `EmergencyCommandPage.tsx`
  - `SosRadarPage.tsx`
  - `IncidentVerificationPage.tsx`
  - `CorridorGeofencingPage.tsx`
  - `AccessibilityMatrixPage.tsx`
- **Tables**: Active Driver SOS Alerts, Unverified Field Incident Reports, Highway Corridor Risk Status, NDRF/BRO Rescue Unit Dispatch Queue.
- **Maps**: Real-Time Emergency GIS Map (SOS panic markers, corridor closures, flood contours).
- **Primary Actions**:
  - Acknowledge driver SOS panic alert
  - Issue official rescue dispatch (NDRF / BRO / SDRF)
  - Verify ground incident report and calculate impact chain
  - Execute emergency highway corridor closure (Override risk to 95.0)
  - Mark emergency SOS resolved
- **Secondary Actions**: Inject storm simulation, broadcast regional weather advisories, request field officer photo audit.
- **Alerts**: Red Flashing SOS Panic Alerts, Landslide Threat Alerts, Flood Warnings.
- **Notifications**: Driver emergency panic broadcasts, field officer report submissions.
- **Reports**: Incident Impact Chain PDF Report, Emergency Response Audit.
- **Settings**: District Radar Refresh Frequency, SOS Sound Alerts.

---

## 2.3 ROLE: `LOGISTICS_OPERATOR`

- **Default Route**: `/logistics`
- **Navigation Bar Items**:
  - Logistics Command (`/logistics`)
  - Fleet Map (`/logistics/fleet`)
  - AI Route Planner (`/logistics/routes`)
  - Supply Gap Intelligence (`/logistics/supply-gaps`)
  - Cold-Chain Monitoring (`/logistics/cold-chain`)
- **Dashboard Widgets**: Active Fleet Movement, Cold-Chain Thermal Budget Decay, AI Detour Recommendations, District Supply Gap Risk Scores.
- **Pages**:
  - `LogisticsCommandPage.tsx`
  - `FleetTelemetryPage.tsx`
  - `AiRoutePlannerPage.tsx`
  - `SupplyGapIntelligencePage.tsx`
  - `ColdChainMonitoringPage.tsx`
- **Tables**: Managed Fleet Vehicles, Active Shipments, AI Route Detour Comparisons, Warehouse Stock & Inventory Feeds.
- **Maps**: Regional Logistics Fleet Tracking Map (Truck vectors, thermal indicators, alternative route overlays).
- **Primary Actions**:
  - Inspect AI-recommended route detours
  - Compare detour distance, time, and cost deltas
  - Approve vehicle reroute detour
  - Issue final commercial delivery confirmation
- **Secondary Actions**: Export NDMA Logistics Summary PDF, filter fleet by cargo priority, monitor perishable cargo thermal decay.
- **Alerts**: Corridor Disruption Alerts, Cold-Chain Temperature Spikes, High Supply Gap Warnings.
- **Notifications**: Route detour recommendations, driver arrival notifications, delivery confirmation requests.
- **Reports**: Convoy Reroute Analysis PDF, District Supply Gap Report.
- **Settings**: Fleet Refresh Rate, Temperature Unit (°C), Routing Optimization Preferences (Cost vs. Speed).

---

## 2.4 ROLE: `FIELD_OFFICER`

- **Default Route**: `/field`
- **Navigation Bar Items**:
  - Field Inspection (`/field`)
  - Assigned Tasks (`/field/tasks`)
  - Report Hazard (`/field/report-hazard`)
  - Evidence Upload (`/field/upload-evidence`)
- **Dashboard Widgets**: Assigned Inspection Tasks, Recent Ground Submissions, Local Weather Warnings, Offline Sync Queue Status.
- **Pages**:
  - `FieldInspectorPage.tsx`
  - `AssignedTasksPage.tsx`
  - `HazardReporterPage.tsx`
  - `EvidenceUploadPage.tsx`
- **Tables**: Assigned Inspection Tasks, Submitted Field Hazard Reports, Sync Queue.
- **Maps**: Local Corridor Map (Assigned task pins, reported hazard markers).
- **Primary Actions**:
  - Acknowledge assigned field inspection task
  - Capture and upload geotagged photo evidence
  - Submit ground hazard inspection report
  - Update task progress (`IN_PROGRESS`, `COMPLETED`)
- **Secondary Actions**: Sync offline reports when re-entering cellular range, view local weather radar.
- **Alerts**: New Field Task Assignment Alerts, Local Flash Flood Advisories.
- **Notifications**: Task dispatch notifications from Emergency Control.
- **Reports**: Field Inspection Summary.
- **Settings**: Camera Resolution, Offline Cache Limits, GPS High Precision Mode.

---

## 2.5 ROLE: `DRIVER`

- **Default Route**: `/driver`
- **Navigation Bar Items**:
  - Driver Console (`/driver`)
  - My Vehicle (`/driver/vehicle`)
  - My Shipment (`/driver/shipment`)
  - En-Route Hazards (`/driver/hazards`)
  - SOS Panic Button (`/driver/sos`)
- **Dashboard Widgets**: Assigned Vehicle Status, Current Cargo Manifest, Turn-by-Turn Route Navigation, 1-Tap SOS Panic Button, Actionable Risk Warnings.
- **Pages**:
  - `DriverPortalPage.tsx`
  - `MyVehiclePage.tsx`
  - `MyShipmentPage.tsx`
  - `DriverHazardReporterPage.tsx`
  - `DriverSosPage.tsx`
- **Tables**: Assigned Shipment Manifest, Delivery Milestone Log.
- **Maps**: Driver Turn-by-Turn Navigation Map (Current GPS position, active route line, actionable hazard callouts).
- **Primary Actions**:
  - Press 1-Tap Emergency SOS Panic Button
  - Submit en-route hazard report (rockfall, fallen tree)
  - Update delivery status (`IN_TRANSIT`, `DELAYED`, `ARRIVED`)
- **Secondary Actions**: View actionable hazard warnings, check vehicle fuel/battery level, toggle night mode.
- **Alerts**: High-Priority Actionable Risk Warnings (*"⚠️ HIGH LANDSLIDE HAZARD Ahead — Recommended Action: STOP / REROUTE"*).
- **Notifications**: Control room emergency instructions, route detour updates.
- **Reports**: Driver Trip Summary.
- **Settings**: Audio Alert Volume, Language Preference (English, Assamese, Bengali, Hindi), Offline Navigation Storage.

---

# 3. PRODUCT UI CLEANUP RULES

1. **Strict 5-Option Role Selection**: In `RegisterPage.tsx` and `UserManagementPage.tsx`, the role select element MUST expose strictly 5 canonical choices:
   - `ADMIN`
   - `EMERGENCY_OPERATOR`
   - `LOGISTICS_OPERATOR`
   - `FIELD_OFFICER`
   - `DRIVER`
2. **`SUPER_ADMIN` Removal**: `SUPER_ADMIN` is completely removed from all UI selects, navigation sidebars, and user badges.
3. **`DISTRICT_AUTHORITY` Relabeling**: Any legacy references to `DISTRICT_AUTHORITY` in UI labels are standardized to `EMERGENCY_OPERATOR`.
