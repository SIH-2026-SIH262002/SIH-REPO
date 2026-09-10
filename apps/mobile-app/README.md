# NER LogiSense Mobile Application (Expo / Android)

Production-grade Expo React Native Android Application for **NER LogiSense** — AI-based Smart Logistics & Accessibility Intelligence Platform for the North Eastern Region.

---

## Architecture Overview

The mobile application connects directly to the existing **FastAPI backend** (`backend/app/main.py`), utilizing real-time sensor node feeds, machine learning landslide risk predictions, vehicle fleet tracking, incident reporting with offline persistence, and emergency SOS dispatches.

```text
Existing SIH FastAPI Backend (Port 8000)
              │
              ▼
    Centralized Axios Client (src/api/client.ts)
    JWT Token Auth (Expo SecureStore)
              │
              ▼
   Expo React Native Android Mobile App (apps/mobile-app)
   ┌──────────┬──────────┬──────────┬──────────┐
   ▼          ▼          ▼          ▼          ▼
Dashboard   Live Map   Risk AI    Alerts    Incidents & SOS
```

---

## Directory Structure

```text
apps/mobile-app/
├── app/
│   ├── _layout.tsx           # Root provider layout (Auth, Offline, Safe Area)
│   ├── index.tsx             # Entry auth check & router redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx         # Login Screen with SecureStore JWT auth
│   └── (tabs)/
│       ├── _layout.tsx       # Bottom Tab Bar navigation
│       ├── index.tsx         # Dashboard Screen (Metrics, Risk score, Alerts)
│       ├── map.tsx           # Live Map Screen (Sensors, Vehicles, Incidents)
│       ├── risk.tsx          # ML Risk Assessment Simulator & Feature Importance
│       ├── alerts.tsx        # Real-time Hazard Alerts
│       ├── vehicles.tsx      # Fleet Vehicle Telemetry & Speed tracking
│       ├── incidents.tsx     # GPS & Photo Incident Reporter with Offline Queue
│       ├── sos.tsx           # Emergency One-Tap SOS Dispatch
│       └── profile.tsx       # User Credentials & API Config
├── src/
│   ├── api/                  # Axios API services matching FastAPI endpoints
│   ├── components/           # UI components (InteractiveMap, RiskBadge, StatCard, Header)
│   ├── constants/            # Design system, Risk severity colors, Theme
│   ├── context/              # AuthContext & OfflineContext
│   ├── services/             # SecureStore, LocationService, OfflineQueue
│   └── types/                # TypeScript interface definitions
├── app.json                  # Android package `com.sih262002.nerlogisense` & permissions
├── eas.json                  # EAS build configurations for Android preview & APK
└── package.json
```

---

## Prerequisites

- **Node.js**: v18+ (Recommended v20 or v22)
- **Expo CLI**: `npm install -g expo-cli` (or use `npx expo`)
- **Android Studio / Emulator** or physical Android device with **Expo Go** app installed.
- **Python 3.10+** (for running the local FastAPI backend).

---

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd apps/mobile-app
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Set `EXPO_PUBLIC_API_URL`:
   - **Android Emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`
   - **Physical Phone (Wi-Fi)**: `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:8000` (e.g. `http://192.168.1.15:8000`)
   - **Production**: `EXPO_PUBLIC_API_URL=https://api.nerlogisense.gov.in`

---

## How to Find Your Local IP Address for Android Physical Phone Testing

On Windows PowerShell / CMD:
```powershell
ipconfig
```
Look for `IPv4 Address` under your active Wi-Fi adapter (e.g. `192.168.x.x`).

Make sure your phone and development PC are on the same Wi-Fi network.

---

## Running the Application

1. **Start the FastAPI Backend**:
   In the repository root:
   ```bash
   start.bat
   ```
   *or manually:*
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the Expo Development Server**:
   ```bash
   cd apps/mobile-app
   npx expo start
   ```

3. **Open on Android**:
   - Press `a` in the terminal to launch on connected Android Emulator.
   - Scan the QR code using **Expo Go** on a physical Android phone.

---

## Building Android APK with EAS

To generate a standalone preview APK for physical Android installation:

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to Expo account**:
   ```bash
   eas login
   ```

3. **Build Android APK**:
   ```bash
   eas build --platform android --profile preview
   ```

---

## Troubleshooting

- **Connection Error / Network Error on Login**:
  - Verify FastAPI is running at `http://localhost:8000/docs`.
  - For physical Android devices, ensure host IP is set in `.env` and firewall allows port 8000 traffic.
- **Location Permission Denied**:
  - Open Android Device Settings > Apps > NER LogiSense > Permissions > Location > Allow.
- **Offline Sync Queue**:
  - Incident reports submitted while offline are saved in device storage and synced automatically when back online or by tapping "Sync Now" in the top banner.
