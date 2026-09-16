# NER LogiSense — Multilingual Implementation Specification & Documentation

## Executive Summary

The **NER LogiSense** platform features full frontend internationalization (i18n) powered by `i18next`, `react-i18next`, and `i18next-browser-languagedetector`. The implementation provides real-time, persistent, high-quality UI translation across all 6 targeted regional languages and all 5 platform operational roles.

---

## 1. Supported Languages

| Code | English Name | Native Name | Script / Region | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`en`** | English | English | Latin (Baseline) | Complete |
| **`hi`** | Hindi | हिन्दी | Devanagari | Complete |
| **`as`** | Assamese | অসমীয়া | Bengali-Assamese | Complete |
| **`bn`** | Bengali | বাংলা | Bengali-Assamese | Complete |
| **`mn`** | Manipuri (Meitei) | ꯃꯩꯇꯩꯂꯣꯟ | Meitei Mayek / Bengali | Complete |
| **`mz`** | Mizo | Mizo | Latin | Complete |

---

## 2. i18n Architecture

The internationalization architecture is established at `apps/web-dashboard/src/i18n/`:

- **Configuration File**: [`apps/web-dashboard/src/i18n/i18n.ts`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/i18n/i18n.ts)
- **Initialization**: Imported directly in [`apps/web-dashboard/src/main.tsx`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/main.tsx) before React DOM initialization to prevent text flash or unrendered translation keys.
- **Language Detection & Persistence**: Configured via `i18next-browser-languagedetector` with `order: ['localStorage', 'navigator']` and `caches: ['localStorage']` under key `i18nextLng`.
- **Fallback**: Defaults safely to English (`en`).
- **Key Parity**: 100% key structure parity across all 6 locale files (`en.json`, `hi.json`, `as.json`, `bn.json`, `mn.json`, `mz.json`).

---

## 3. Locale Files Location & Structure

Locale JSON files are stored in:
`apps/web-dashboard/src/i18n/locales/`

- [`en.json`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/i18n/locales/en.json)
- [`hi.json`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/i18n/locales/hi.json)
- [`as.json`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/i18n/locales/as.json)
- [`bn.json`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/i18n/locales/bn.json)
- [`mn.json`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/i18n/locales/mn.json)
- [`mz.json`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/i18n/locales/mz.json)

### Key Namespace Categories:
- `common`: Generic actions, status indicators, filters, forms, error/loading states.
- `header`: System telemetry, corridor badges, stream indicators, mode toggles.
- `language`: Native and English language selection names.
- `nav`: Sidebar and command module navigation labels across all consoles.
- `roles`: Human-readable translated role titles for all 5 platform roles.
- `auth`: Login, forgot password, reset password, and unauthorized access pages.
- `profile`: Profile overview, personal details, password modification.
- `settings`: Protocol invariants, risk thresholds, and language preferences.
- `emergency`: Emergency SOS command, incident triage, override protocols, casualty reports.
- `logistics`: Fleet operations, active journeys, proof-of-delivery, reroutes, warehouse depots.
- `field`: Field officer portal, ground verification, incident reporting, photo hash attachments.
- `driver`: Driver telematics, navigation, breakdown reporting, SOS alerts.
- `adminConsole`: User provisioning, district registries, model transparency, audit logs.

---

## 4. Reusable Language Selector Component

Component path:
[`apps/web-dashboard/src/components/common/LanguageSelector.tsx`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/components/common/LanguageSelector.tsx)

### Features:
- Dropdown menu presenting all 6 supported regional languages with native and English labels.
- Keyboard accessible (`Escape` to dismiss, ARIA menu attributes).
- Responsive, handles click-outside dismissal automatically.
- Integrated into shared layout headers:
  - [`CommandHeader.tsx`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/components/layout/CommandHeader.tsx)
  - [`AdminTopBar.tsx`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/components/admin/layout/AdminTopBar.tsx)
  - [`LogisticsTopBar.tsx`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/components/logistics/layout/LogisticsTopBar.tsx)
  - [`Navbar.tsx`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/components/common/Navbar.tsx)
  - [`SettingsView.tsx`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/components/views/SettingsView.tsx)
  - [`LoginPage.tsx`](file:///E:/My%20projects/SIH-REPO/apps/web-dashboard/src/pages/LoginPage.tsx)

---

## 5. Coverage Across Operational Roles

All 5 platform roles support immediate multilingual rendering:

1. **ADMIN**:
   - Header: `AdminTopBar` with LanguageSelector & i18n titles.
   - Navigation: `AdminSidebar` with translated group labels & items.
   - Console pages: User directory, provisioning, district registry, model audit, service status.

2. **EMERGENCY_OPERATOR**:
   - Header: `CommandHeader` with LanguageSelector & i18n telemetry status.
   - View: `EmergencyOperatorView` with translated SOS headers, triage options, and override protocols.

3. **LOGISTICS_OPERATOR**:
   - Header: `LogisticsTopBar` with LanguageSelector & live stream status.
   - Navigation: `LogisticsSidebar` with translated fleet, journey, reroute, and warehouse menu items.

4. **FIELD_OFFICER**:
   - View: `FieldOfficerDashboardView` with translated incident submission, task lifecycle states, and photo proof verification.

5. **DRIVER**:
   - View: `DriverDashboardView` with dual header/inline driver language selection bar (`AS`, `BN`, `HI`, `MN`, `MZ`, `EN`) fully synchronized with global `i18n.changeLanguage()`.

---

## 6. Zero-False-Data & Technical Term Integrity

- Programmatic IDs (`VEH-001`, `SOS-991`, `NH-27`), API endpoints, database values, and state machine enum values (`ACTIVE_PANIC`, `RESCUE_DISPATCHED`, `EMERGENCY_OPERATOR`) remain unmodified.
- Interpolation variables (`{{count}}`, `{{minutes}}`, `{{score}}`, `{{distance}}`) are preserved in every language file.
- Technical acronyms (API, GPS, GIS, WebSocket, ML, AI, WPC, P2P, MTU, TTL) remain standard across all regional translations.

---

## 7. Verification & Build Integrity

- **JSON Validation**: Verified 100% key parity across all 6 locale files via automated script.
- **Build Verification**: Executed `npm run build` cleanly (1960 modules compiled successfully).
- **Lint Verification**: Executed `npm run lint` cleanly (0 errors, 0 warnings).
