# Emergency Operator — Zero-Based Rebuild & Complete SOS Backend Integration

## 1. Overview & Architecture

The Emergency Operator console in **NER LogiSense** has been rebuilt from scratch as an institutional, zero-simulation, fully backend-integrated operational surface.

### Key Architectural Decisions
- **Zero Mock Data**: Removed all legacy demo mockups (e.g., hardcoded `SOS-991` alerts, fake setInterval timers).
- **Dedicated Route Tree (`/emergency/*`)**: Routed via `EmergencyRoutes.tsx` protected by role authorization (`EMERGENCY_OPERATOR`, `ADMIN`, `DISTRICT_AUTHORITY`).
- **Institutional Light UI Theme (`emergency.css`)**: High-contrast, accessibility-compliant operational interface with clear status hierarchies and live stream status indicator.
- **Microservice Integration**: Communicates directly with Spring Boot `core-service` (`http://localhost:8080` via `sosApi.ts`) for real-time SOS workflow and emergency resource dispatch.
- **Multilingual Support (i18n)**: All UI elements, statuses, action dialogues, and empty states support 6 regional languages (English `en`, Hindi `hi`, Assamese `as`, Bengali `bn`, Manipuri `mn`, Mizo `mz`).

---

## 2. Route & Component Structure

| Route | Component | Purpose |
|---|---|---|
| `/emergency` | `EmergencyOverviewPage.tsx` | District-scoped operational dashboard with live status cards, active SOS feed, and recent acknowledged incidents. |
| `/emergency/sos` | `EmergencySosQueuePage.tsx` | Full SOS Queue with status filtering (All, Triggered, Received, Acknowledged, In Progress). |
| `/emergency/sos/:id` | `EmergencySosDetailPage.tsx` | Comprehensive incident command view: telemetry, offline P2P mesh relay diagnostics, map coordinates, responder dispatch action, and formal resolution workflow. |
| `/emergency/resources` | `EmergencyResourcesPage.tsx` | Live registry of NDRF teams, ambulances, and heavy recovery units with SOS assignment capability. |
| `/emergency/notifications` | `EmergencyNotificationsPage.tsx` | Audit notifications and emergency dispatch alerts feed. |
| `/emergency/profile` | `EmergencyProfilePage.tsx` | Operator identity, district assignment, and platform permission verification. |

---

## 3. Backend SOS API Integration Matrix

All endpoints interact directly with Spring Boot `core-service`:

| Capability | Backend Endpoint | Method | Security / Authority | Purpose in Frontend |
|---|---|---|---|---|
| **Active SOS Feed** | `/api/sos/active` | `GET` | `SOS_VIEW` | District-filtered active emergencies for the operator. |
| **SOS Details** | `/api/sos/{id}` | `GET` | `SOS_VIEW` | Detailed telemetry, driver message, mesh relay hop metrics, and coordinates. |
| **Acknowledge SOS** | `/api/sos/{id}/acknowledge` | `PUT` | `SOS_ACKNOWLEDGE` | Moves status from `TRIGGERED`/`RECEIVED` to `ACKNOWLEDGED`. Records acknowledging operator identity. |
| **Assign Responder** | `/api/sos/{id}/assign` | `PUT` | `SOS_DISPATCH` | Assigns designated rescue personnel/unit and transitions status to `RESPONDER_ASSIGNED`. |
| **Resolve SOS** | `/api/sos/{id}/resolve` | `PUT` | `SOS_RESOLVE` | Formally closes emergency with resolution notes and timestamps. |
| **SOS Acknowledgments** | `/api/sos/acks` | `GET` | Authenticated | Fetches active acknowledgment logs. |
| **Emergency Resources** | `/api/emergency/resources` | `GET` | `SOS_VIEW` | Fetches available rescue assets, heavy equipment, and ambulances. |
| **Dispatch Resource to SOS** | `/api/emergency/resources/{resId}/assign-sos/{sosId}` | `POST` | `SOS_DISPATCH` | Atomically assigns resource to an emergency event (prevents double-booking via 409 conflict). |

---

## 4. Offline Mesh Relay Store-and-Forward Detection

In North Eastern hill corridors with intermittent cellular coverage, SOS transmissions may propagate over ad-hoc vehicle-to-vehicle LoRa/BLE mesh relays. The new console detects and surfaces this telemetry:
- **Delivery Type**: Identifies whether the packet arrived via `DIRECT_CELLULAR` or `MESH_RELAY_STORE_FORWARD`.
- **Relay Vehicle Code**: Displays the vehicle code that ferried the packet back to a cellular-connected base.
- **Relay Hop Count & Latency**: Measures store-and-forward transit delays in minutes and network hops.
- **Integrity**: Validates the CRC-32 checksum and packet ID logged by the edge firmware.

---

## 5. Cleanup & Removal of Obsolete Code

- **Deleted `EmergencyOperatorView.tsx`**: Eliminated legacy single-file mock component containing artificial arrays and fabricated data.
- **Cleaned `DashboardPage.tsx`**: Directs any `EMERGENCY_OPERATOR` user directly to `/emergency` and removed references to legacy view components.
- **Cleaned `Sidebar.tsx`**: Scoped legacy sidebar items so that operators only interact with authoritative consoles.
- **Temporary Injection Scripts**: Removed `inject-emergency-keys.cjs` and `inject-emergency-keys.js` after successfully populating all 6 regional locale dictionaries.

---

## 6. Verification & Quality Gates

1. **Typecheck & ESLint**: Passes with `0 errors` (`npm run lint`).
2. **Vite Production Bundle**: Builds cleanly with `0 errors` (`npm run build`).
3. **Core Service Backend**: Compiles cleanly with Maven (`BUILD SUCCESS`).
4. **FastAPI Gateway & Auth**: All 19 backend test suites pass (`19 passed`).
