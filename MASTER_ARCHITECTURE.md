# 📖 NER LogiSense — Master Architecture & Living Codebase Index

> **Project Title**: NER LogiSense — AI-Based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region (MDoNER Problem Statement 26002)  
> **Repository Root**: `e:\My projects\SIH-REPO`  
> **Last Updated**: 2026-09-07  
> **Purpose**: Living architectural document & complete code index detailing every file, class, component, API endpoint, database entity, streaming pipeline, ML model, theme system, and change log.

---

## 📑 Table of Contents

1. [System High-Level Architecture](#1-system-high-level-architecture)
2. [Complete Directory & File Registry](#2-complete-directory--file-registry)
3. [Enterprise Java Core Backend (`backend/core-service`)](#3-enterprise-java-core-backend-backendcore-service)
4. [FastAPI Gateway & WebSocket Pipeline (`backend/app`)](#4-fastapi-gateway--websocket-pipeline-backendapp)
5. [React 19 Command Center Frontend (`apps/web-dashboard`)](#5-react-19-command-center-frontend-appsweb-dashboard)
6. [Machine Learning Engine (`ml/`)](#6-machine-learning-engine-ml)
7. [Simulation Suite & Presentation Controllers](#7-simulation-suite--presentation-controllers)
8. [Data Models & Geospatial Database Schema](#8-data-models--geospatial-database-schema)
9. [Living Change Log](#9-living-change-log)

---

## 1. System High-Level Architecture

```
                                  ┌─────────────────────────────────────────────────────────────┐
                                  │                NER LOGISENSE HIGH-LEVEL STACK               │
                                  └─────────────────────────────────────────────────────────────┘
                                                                 │
         ┌───────────────────────────────────────┬───────────────┴───────────────┬───────────────────────────────────────┐
         │                                       │                               │                                       │
         ▼                                       ▼                               ▼                                       ▼
┌─────────────────────────┐             ┌─────────────────────────┐             ┌─────────────────────────┐             ┌─────────────────────────┐
│   React 19 Frontend     │             │  Java 21 Core Backend   │             │   FastAPI Gateway & WS  │             │   ML Inference Engine   │
│   (apps/web-dashboard)  │             │  (backend/core-service) │             │   (backend/app)         │             │   (ml/)                 │
│                         │             │                         │             │                         │             │                         │
│ • GIS Command Map       │ ──REST/WS──►│ • Spring Boot 3.2       │ ──REST/WS──►│ • Real-time /ws Stream  │ ──Inference─►│ • XGBoost / LightGBM │
│ • 3-Route AI Planner    │             │ • PostGIS Spatial DB    │             │ • Sensor State Tick Loop│             │ • 14 Geo-Features       │
│ • ML Risk Playground    │             │ • Kafka Telemetry Topic │             │ • Simulated Telemetry   │             │ • Continuous Risk (0-100│
│ • Emergency SOS Radar   │             │ • Redis GEOADD Cache    │             │ • REST Endpoints        │             │ • Feature Importances   │
│ • Light/Dark Themes     │             │ • Dempster-Shafer Risk  │             │                         │             │                         │
│ • Voice & PDF Export    │             │ • BLE SOS Protocol      │             │                         │             │                         │
└─────────────────────────┘             └─────────────────────────┘             └─────────────────────────┘             └─────────────────────────┘
```

---

## 2. Complete Directory & File Registry

```
SIH-REPO/
├── .env.example                               # Environment variable template
├── .gitignore                                 # Git exclusion rules
├── ARCHITECTURE_REVIEW.md                     # Deep-dive architectural review & vulnerability analysis
├── LICENSE                                    # Apache 2.0 Open Source License
├── README.md                                  # Main project documentation & quick start guide
├── MASTER_ARCHITECTURE.md                     # THIS FILE — Living master code index & architectural record
├── start.bat                                  # Windows one-click full-stack launcher script
├── simulate.bat                               # Windows one-click standalone presentation CLI launcher
│
├── apps/
│   ├── mobile-app/                            # Flutter mobile app structure for drivers & field officers
│   │   ├── lib/                               # Mobile application source code
│   │   └── pubspec.yaml                       # Flutter package specification
│   └── web-dashboard/                         # Main React 19 + Vite Command Center Frontend
│       ├── index.html                         # Entry HTML file
│       ├── package.json                       # npm dependencies (React 19, Leaflet, TailwindCSS, Axios)
│       ├── vite.config.js                     # Vite build configuration
│       ├── eslint.config.js                   # ESLint configuration
│       └── src/
│           ├── App.tsx                        # Root App component with providers
│           ├── App.css                        # App-level styling
│           ├── index.css                      # Global CSS, CSS custom variables (Light/Dark), Leaflet styles
│           ├── main.tsx                       # React DOM root entry point
│           ├── api/                           # API client configuration
│           │   ├── apiClient.ts               # Axios instance setup
│           │   └── authApi.ts                 # Authentication REST endpoints
│           ├── components/                    # Modular UI components
│           │   ├── common/                    # Shared UI utilities (Banners, Modals)
│           │   ├── dashboard/                 # Dashboard panels (LiveSensors, LiveAlerts, RiskPanel)
│           │   ├── layout/                    # CommandHeader.tsx, Sidebar.tsx
│           │   ├── map/                       # NERMap.tsx, LayerControl.tsx, MapLegend.tsx
│           │   └── views/                     # 9 Command Module Views
│           │       ├── AIRoutePlannerView.tsx # 3-Route comparison & NetworkX route planning
│           │       ├── MLRiskPlaygroundView.tsx # XGBoost/LightGBM model metrics & live sliders
│           │       ├── EmergencySOSView.tsx   # Driver emergency radar & dispatch button
│           │       ├── FieldView.tsx          # Field officer offline sync queue & incident reporter
│           │       ├── VehiclesView.tsx       # Fleet tracking & vehicle telemetry list
│           │       ├── ShipmentsView.tsx      # Essential logistics & thermal budget status
│           │       ├── NotificationsOutboxView.tsx # Twilio WhatsApp/SMS outbox log & subscribers
│           │       ├── SettingsView.tsx       # Platform configuration & settings
│           │       ├── AccessibilityView.tsx # Regional district accessibility scores
│           │       └── IncidentsView.tsx      # Ground incident verification list
│           ├── context/                       # React Context Providers
│           │   ├── AuthContext.tsx            # Auth state management
│           │   └── ThemeContext.tsx           # Light (White) & Dark (Black) theme state manager
│           ├── data/                          # Mock data & 18 NER town coordinates
│           │   └── mockData.ts                # NER towns, routes, mock vehicles, mock incidents
│           ├── hooks/                         # Custom React Hooks
│           │   ├── useAuth.ts                 # Auth hook
│           │   └── useWebSocket.ts            # Live WebSocket connection hook (ws://localhost:8000/ws)
│           ├── routes/                        # Router definitions
│           │   ├── AppRoutes.tsx              # Main route switcher & protected routes
│           │   └── ProtectedRoute.tsx         # Role-based route guard
│           ├── services/                      # API & Device Services
│           │   ├── apiService.ts              # Unified REST API service for FastAPI / Spring Boot
│           │   ├── voiceService.ts            # Web Speech API audio alert announcements (EN/HI/AS)
│           │   ├── districtService.ts         # District accessibility endpoints
│           │   ├── incidentService.ts         # Incident management endpoints
│           │   ├── logisticsService.ts        # Logistics & shipment endpoints
│           │   └── vehicleService.ts          # Vehicle telemetry endpoints
│           ├── types/                         # TypeScript interfaces
│           │   ├── district.ts                # District interfaces
│           │   ├── incident.ts                # Incident interfaces
│           │   ├── shipment.ts                # Shipment interfaces
│           │   ├── simulation.ts              # Simulation state interfaces
│           │   └── vehicle.ts                 # Vehicle interfaces
│           └── utils/                         # Utility helper functions
│               └── exportUtils.ts             # 1-Click Executive NDMA PDF Summary Report Generator
│
├── backend/
│   ├── requirements.txt                       # Python backend dependencies (FastAPI, XGBoost, LightGBM, Twilio)
│   ├── sim_cli.py                             # Interactive CLI Terminal Controller for hackathon judge demos
│   ├── app/                                   # Python FastAPI Web Server & Gateway
│   │   ├── main.py                            # FastAPI entry point, CORS, background tasks, routing
│   │   ├── ws.py                              # Real-time WebSocket endpoint (/ws)
│   │   ├── graph_data.py                      # 18 NER town coordinates & NetworkX road graph
│   │   ├── translations.py                    # Multilingual dictionaries (EN, HI, AS)
│   │   ├── routers/                           # FastAPI Router Endpoints
│   │   │   ├── alerts.py                      # Active risk alerts REST API
│   │   │   ├── dashboard.py                   # Dashboard summary REST API
│   │   │   ├── i18n.py                        # Multilingual translation REST API
│   │   │   ├── notify.py                      # Twilio outbox & subscribers REST API
│   │   │   ├── reports.py                     # Field incident report REST API
│   │   │   ├── risk.py                        # ML risk prediction & feature importance REST API
│   │   │   ├── routes.py                      # NetworkX AI route planning REST API
│   │   │   ├── sensors.py                     # Live sensor state & storm injection REST API
│   │   │   ├── sos.py                         # Emergency SOS trigger & resolve REST API
│   │   │   └── vehicles.py                    # Vehicle GPS telemetry REST API
│   │   └── services/                          # Python Backend Core Services
│   │       ├── ml_service.py                  # XGBoost/LightGBM model bundle loader & inference
│   │       ├── notify_service.py              # Twilio WhatsApp/SMS notification engine
│   │       ├── reports_service.py             # Field report processing & score override
│   │       ├── routing_service.py             # NetworkX Dijkstra risk-avoidant route solver
│   │       ├── simulation_service.py          # Sensor state tick loop & storm injection
│   │       ├── vehicle_service.py             # Vehicle motion simulator & route tracing
│   │       └── weather_service.py             # OpenWeatherMap API & weather model
│   ├── core-service/                          # Production Java 21 + Spring Boot 3.2 Backend
│   │   ├── pom.xml                            # Maven dependencies (Java 21, PostGIS, Kafka, Redis, JWT)
│   │   └── src/main/java/com/ner/logistics/   # 151 Java source files (37 RestControllers, 26 Services, 20 Entities)
│   │       ├── accessibility/                 # PostGIS CorridorProfile & Geofencing
│   │       ├── alert/                         # Alert Acknowledgement entities
│   │       ├── audit/                         # Security Audit logging
│   │       ├── auth/                          # JWT Authentication & OTP Service
│   │       ├── common/                        # Health, Rate Limiter & Global Exception Handler
│   │       ├── config/                        # Security, Kafka, Redis & PostGIS Configs
│   │       ├── dashboard/                     # STOMP WebSocket & Executive Dashboard Controllers
│   │       ├── decision/                      # Operational Decision Engine & OperationalOutcome
│   │       ├── device/                        # IoT Device Registration Service
│   │       ├── emergency/                     # NDRF / SDRF Emergency Resource Controller
│   │       ├── fieldtask/                     # Field Officer Task Assignment Service
│   │       ├── file/                          # File Upload & Magic Byte Validation
│   │       ├── governance/                    # Data Governance Controller
│   │       ├── i18n/                          # Spring Dynamic Translation Service
│   │       ├── incident/                      # 3-Stage Incident Governance Workflow
│   │       ├── mobile/                        # Native Mobile Driver & Officer Endpoints
│   │       ├── notification/                  # Notification Log & Mock Adapters
│   │       ├── recovery/                      # CorridorRecoveryPrediction & History Tables
│   │       ├── risk/                          # Dempster-Shafer Confidence & Risk Engine
│   │       ├── routing/                       # GraphHopper / Dijkstra Routing Service
│   │       ├── sensor/                        # MQTT Sensor Ingestion Adapter
│   │       ├── shipment/                      # Supply Criticality & Cold-Chain Thermal Budget
│   │       ├── simulation/                    # Simulation Scenario Controller
│   │       ├── sos/                           # Store-Carry-Forward BLE Mesh SOS Protocol
│   │       ├── tracking/                      # Kafka Consumer, Redis GEOADD, Write-Behind Buffer
│   │       ├── user/                          # User Entity & ABAC Security Aspect
│   │       ├── vehicle/                       # Vehicle Registry & Journey Status
│   │       └── weather/                       # Weather Integration Service
│   └── auth-service/                          # Node.js Auth Service
│
├── data/                                      # Data Generation
│   ├── generate_dataset.py                    # Script generating 4000-row sensor dataset
│   └── ner_landslide_sensor_dataset.xlsx      # Synthetic sensor readings Excel file
│
└── ml/                                        # Machine Learning Training Engine
    ├── train_model.py                         # Trains XGBoost / LightGBM model bundle
    ├── requirements.txt                       # Python ML dependencies
    ├── model_bundle.joblib                    # Trained ML model bundle artifact
    └── training_metrics.json                  # Model accuracy metrics (MAE, R2, ROC-AUC)
```

---

## 3. Enterprise Java Core Backend (`backend/core-service`)

Built on **Java 21** and **Spring Boot 3.2.3** (`com.ner.logistics.*`), providing production-grade government infrastructure:

- **151 Java Source Files**:
  - **37 Spring REST Controllers** (`LogisticsOperatorDashboardController`, `EmergencyResourceController`, `IncidentController`, `MobileDriverController`, `RerouteOrderController`, `RiskController`, `DataGovernanceController`, `AuditController`, `TrackingController`, `SosController`, `ShipmentController`, etc.).
  - **26 Core Services** (`RiskEngineService`, `RedisSpatialCacheService`, `SosService`, `SupplyGapAnalysisService`, `LogisticsDecisionService`, `CorridorRecoveryPredictionService`, `TrackingKafkaConsumer`, etc.).
  - **20 JPA Entities** (`CorridorProfile`, `CorridorRecoveryHistory`, `CorridorRecoveryPrediction`, `Incident`, `VehicleLocation`, `OperationalOutcome`, `SosEvent`, `ThermalBudgetStatus`, `NotificationLog`, `Device`, `AuditEvent`, `District`, `Corridor`, etc.).
- **Dempster-Shafer Confidence Engine (`RiskEngineService.java`)**: Calculates time-decayed confidence $C(t) = C_0 \cdot e^{-\lambda \Delta t}$ and merges multi-source sensor/human evidence.
- **Store-Carry-Forward BLE Mesh SOS (`SosProtocolSpec.java`)**: 247-byte MTU budget, 120ms discovery window, 5-hop TTL, and lineage tracking headers.
- **Supply Criticality & Thermal Budget Routing (`SupplyCriticalityCalculator.java`)**: Evaluates cargo priority (Vaccines/Oxygen > Food Rations) and cold-chain temperature degradation before generating `WAIT`, `REROUTE`, `HOLD`, or `EMERGENCY_REROUTE` commands.
- **ABAC Security (`ResourceOwnershipSecurityAspect.java`)**: Enforces row-level security across 5 strict roles (`ADMIN`, `LOGISTICS_OPERATOR`, `EMERGENCY_OPERATOR`, `FIELD_OFFICER`, `DRIVER`).

---

## 4. FastAPI Gateway & WebSocket Pipeline (`backend/app`)

Serves as the high-speed gateway and real-time streaming provider for the Web Dashboard:

- **`main.py`**: Uvicorn server setup, background tick loops (`simulation_service.run_forever()`, `vehicle_service.tick_vehicles()`), Static File mounting (`/uploads`), and router inclusions.
- **`ws.py`**: WebSocket endpoint `/ws` streaming `SNAPSHOT` frames on connection and `DELTA` frames for real-time sensor updates, alerts, vehicle positions, and SOS events.
- **`routers/sensors.py`**: Provides GET `/api/sensors`, POST `/api/sensors/inject-storm` (for live storm injection), and POST `/api/sensors/reset-scenario`.
- **`routers/routes.py`**: Calls `routing_service.py` to calculate risk-avoidant routes using NetworkX Dijkstra algorithm.
- **`routers/risk.py`**: Invokes `ml_service.py` for live XGBoost/LightGBM model risk predictions and feature importances.
- **`routers/sos.py`**: Manages driver SOS triggers and resolution endpoints.
- **`routers/notify.py`**: Exposes Twilio WhatsApp/SMS outbox log and subscriber registration.

---

## 5. React 19 Command Center Frontend (`apps/web-dashboard`)

Built using **React 19, Vite, TypeScript, Leaflet, and Vanilla CSS Tokens**:

- **☀️/🌙 Theme System (`ThemeContext.tsx`, `index.css`)**:
  - **Light Mode**: White background (`#ffffff` / `#f8fafc`), dark slate text (`#0f172a`), light borders, CartoDB Voyager Light map tiles.
  - **Dark Mode**: Black background (`#020617` / `#0f172a`), light text (`#f8fafc`), dark glassmorphic cards, CartoDB Dark Matter tiles.
  - Persistent in `localStorage`.
- **🌐 GIS Command Map (`NERMap.tsx`)**: Leaflet map displaying CartoDB tiles, live sensor risk circles (Green, Amber, Orange, Glowing Red), animated vehicle markers, and popup details.
- **🧠 AI Route Planner (`AIRoutePlannerView.tsx`)**: 3-Route comparison (*Fastest*, *AI Safe Corridor*, *Relief Freight Route*) using NetworkX Dijkstra routing, displaying risk vs ETA trade-offs.
- **🔬 ML Risk Intelligence (`MLRiskPlaygroundView.tsx`)**: Displays active XGBoost / LightGBM model metrics (MAE 5.0, R² 0.85, ROC-AUC 0.94), 18 sensor node grid, live sliders, and XAI factor breakdown.
- **🚨 Emergency SOS Center (`EmergencySOSView.tsx`)**: Driver emergency breakdown radar with 1-click NDRF/SDRF response dispatch.
- **📝 Field Incident Reporter (`FieldView.tsx`)**: Offline sync queue indicator with magic-byte file signature validation and ground-truth score override.
- **💬 Notifications Outbox (`NotificationsOutboxView.tsx`)**: Twilio WhatsApp/SMS outbox log and subscriber registration hub.
- **🔊 Real-Time Voice Alert Engine (`voiceService.ts`)**: Web Speech API audio announcements speaking warnings aloud in English (`EN`), Hindi (`HI`), or Assamese (`AS`).
- **📄 1-Click Executive PDF Export (`exportUtils.ts`)**: Instant print/PDF report generator for NDMA / SEOC officials.

---

## 6. Machine Learning Engine (`ml/`)

- **`train_model.py`**: Trains modern **XGBoost** (`XGBRegressor`/`XGBClassifier`) or **LightGBM** (`LGBMRegressor`/`LGBMClassifier`) models on `data/ner_landslide_sensor_dataset.xlsx`.
- **14 Geo-Environmental Features**: 24h & 72h rainfall (mm), soil moisture (%), soil porosity, vibration intensity, slope angle (°), elevation, distance to stream, vegetation cover, historical landslide count, temperature, humidity, and encoded soil type.
- **Model Bundle (`model_bundle.joblib`)**: Serialized model artifact containing regressor, classifier, soil encoder, feature ordering, and evaluation metrics.
- **Accuracy Metrics (`training_metrics.json`)**: **MAE ~5.0**, **R² ~0.85**, **ROC-AUC ~0.94**.

---

## 7. Simulation Suite & Presentation Controllers

- **`start.bat`**: Windows one-click full-stack launcher script. Checks Python & Node environments, creates virtualenv, generates dataset, trains ML model, installs npm dependencies, launches backend & frontend, and opens the default browser automatically.
- **`simulate.bat` & `sim_cli.py`**: Standalone terminal simulation controller for live hackathon judge presentations. Offers 5 interactive menu options:
  - `[1]`: Reset Baseline Operations across all 18 nodes.
  - `[2]`: Inject Heavy Monsoon Storm in Silchar Corridor (NH-27) — Spikes rainfall (145mm) and risk score (88/100), triggering live map glow, AI route reroute, and Twilio WhatsApp outbox message.
  - `[3]`: Trigger Driver Emergency SOS Breakdown (`NER-07`).
  - `[4]`: Submit Field Officer Ground Truth Override Report.
  - `[5]`: Custom Telemetry Injector.

---

## 8. Data Models & Geospatial Database Schema

### PostGIS & JPA Database Schema Tables
1. **`corridor_profile`**: `id`, `corridor_name`, `highway_code`, `start_node`, `end_node`, `terrain_type`, `slope_angle`, `road_classification`, `dem_elevation`.
2. **`corridor_recovery_history`**: `id`, `corridor_id`, `disruption_event`, `start_time`, `actual_clearance_hours`, `weather_conditions`.
3. **`corridor_recovery_prediction`**: `id`, `corridor_id`, `predicted_clearance_hours`, `confidence_interval_min`, `confidence_interval_max`, `risk_score`.
4. **`incident`**: `id`, `location_geometry (GEOMETRY(Point, 4326))`, `hazard_type`, `severity`, `status`, `reported_by`, `officially_verified`.
5. **`vehicle_location_history`**: `id`, `vehicle_id`, `location_geometry`, `latitude`, `longitude`, `speed_kmh`, `heading`, `timestamp`.
6. **`operational_outcome`**: `id`, `prediction_id`, `decision_taken`, `actual_outcome_clearance_hours`, `model_accuracy_error`.
7. **`sos_event`**: `id`, `vehicle_id`, `driver_name`, `emergency_type`, `latitude`, `longitude`, `cargo`, `status`, `relay_path`.
8. **`thermal_budget_status`**: `id`, `shipment_id`, `current_temp_c`, `max_allowed_temp_c`, `spoilage_hours_remaining`, `integrity_status`.

---

## 9. Living Change Log

All future updates, refactorings, and feature additions MUST be appended to this log:

| Date | Author | Description of Changes | Files Affected |
|---|---|---|---|
| **2026-09-07** | Antigravity AI | Initialized MASTER_ARCHITECTURE.md living document. Standardized frontend Light/Dark themes, FastAPI WebSocket stream, Java 21 Spring Boot core service, XGBoost/LightGBM ML models, and standalone CLI simulation controller (`simulate.bat`). | `MASTER_ARCHITECTURE.md`, `apps/web-dashboard/src/*`, `backend/app/*`, `backend/core-service/*`, `ml/train_model.py`, `simulate.bat` |
