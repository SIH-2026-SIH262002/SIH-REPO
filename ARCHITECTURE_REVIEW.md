# Architecture Review & Vulnerability Analysis

## 1. The SOS "Store-Carry-Forward" Has No Protocol Layer
- **The Flaw**: Concept ("the logistics network becomes the communication network") lacks a concrete protocol specification.
- **Specific Gaps**:
  - *Discovery*: BLE advertising on Android/iOS requires specific permissions and battery tradeoffs. A truck driving past at 40 km/h has ~3–5 seconds of viable BLE range. GATT connection + MTU negotiation + data transfer time exceed window.
  - *Routing*: Store-and-forward lacks TTL, path accumulator (relay chain), and deduplication mechanism.
  - *Wake-up*: Phone in pocket/backgrounded is throttled by Android Doze / iOS background restrictions.
- **Fix Strategy**: Build a concrete protocol spec (packet structure, BLE GATT service UUID, retry logic, TTL, relay chain header, deduplication) combined with pre-positioned LoRa mesh gateway fallbacks.

## 2. ML Pipeline Ground Truth & Survivorship Bias
- **The Flaw**: Predicting landslide probability using rainfall, soil moisture, slope, and historical incidents suffers from sparse, inconsistently geotagged historical data and survivorship bias.
- **Specific Gaps**:
  - *Label Quality*: Government records have kilometer-level accuracy, not precise GPS polygons.
  - *Feature Availability*: Real-time soil moisture sensors missing at scale; satellite SMAP/Sentinel has 1-3 day latency.
  - *Class Imbalance*: Extreme sparsity (~5 events/year/district), leading models to trivially predict "no landslide".
- **Fix Strategy**: Refactor model framing from "Pure Landslide Prediction" to **"Corridor Disruption Risk Score"** utilizing available real-time signals (IMD gridded rainfall, DEM road slope, historical blockage frequency, vehicle telemetry speed anomalies).

## 3. "Closed Loop" Ends at "Learn" Without Feedback Mechanism
- **The Flaw**: SENSE → PREDICT → CORROBORATE → DECIDE → ACT → CONFIRM → LEARN lacks actual execution state tracking for LEARN.
- **Specific Gaps**:
  - No `operational_outcomes` table mapping `prediction_id`, `decision_taken`, and `actual_outcome`.
  - No automated retraining trigger or threshold adaptation in the rule-based risk engine.
- **Fix Strategy**: Implement an explicit `operational_outcomes` table with foreign keys to predictions and decisions, and adaptive risk model weights based on actual outcomes.

## 4. Telemetry Pipeline Resilience & Failure Modes
- **The Flaw**: Telemetry path (GPS → Tracking API → Kafka → Consumer → Redis → PostGIS → WebSocket → Dashboard) introduces 4 separate points of failure without write-behind buffering or circuit breakers.
- **Specific Gaps**:
  - Kafka outage drops incoming telemetry.
  - Redis outage breaks dashboard location rendering.
  - Intermittent mobile connection causes WebSocket churn without snapshot replay.
  - Spatial queries under load throttle PostGIS.
- **Fix Strategy**: Add local SQLite write-behind buffers at Tracking API, circuit breakers for Kafka/Redis, and WebSocket snapshot + delta sync with exponential backoff.

## 5. Multi-Source Confidence Engine Refactoring
- **The Flaw**: Current confidence calculation is simple weighted averaging, lacking true uncertainty quantification or decay.
- **Specific Gaps**:
  - IoT sensor vs. human report disagreement is unhandled.
  - Sensor reading age does not decay confidence over time.
- **Fix Strategy**: Implement Dempster-Shafer belief mass modeling / Bayesian belief decay with explicit time-based exponential decay factor for stale sensor readings.

## 6. Contextual Driver Safety Logic
- **The Flaw**: Rigid speed-threshold camera locking prevents reporting in stationary hazard zones or forces unsafe stops.
- **Specific Gaps**:
  - Stationary vehicles in high-risk zones face hazards while stopped.
  - Drivers seeing obstacles while moving cannot trigger quick voice/one-tap safety alerts.
- **Fix Strategy**: Implement contextual safety rules: allow high-risk one-tap / voice alerts while moving if near a flagged hazard corridor, enforce full photo upload only when safely parked.

## 7. Resource-Level Access Control (ABAC/Ownership Checks)
- **The Flaw**: System relies on role-level security (`hasRole('DRIVER')`), creating horizontal access control vulnerabilities across driver vehicles, shipments, and SOS records.
- **Specific Gaps**:
  - Driver A can query Driver B's vehicle or shipment ID if known.
- **Fix Strategy**: Implement Resource-Level Security / ABAC checks on all endpoints (`currentUser.getId() == resource.getDriverId()`).

## 8. Supply Criticality Score Function
- **The Flaw**: "Supply Criticality-Aware Rerouting" is loosely defined without a mathematical valuation function.
- **Specific Gaps**:
  - Rerouting priorities between competing shipments are ambiguous.
- **Fix Strategy**: Define formal criticality scoring: `Criticality = f(Commodity_Type, Perishability_Hours, Inventory_Deficit, Population_Impact, Time_In_Transit)`.

## 9. Offline-First Sync & Conflict Resolution
- **The Flaw**: Offline field reports lack robust multi-writer conflict resolution and database encryption.
- **Specific Gaps**:
  - Concurrent offline edits cause last-write-wins timestamp drift.
  - Local SQLite on Android is unencrypted.
- **Fix Strategy**: Add server-side monotonic timestamping, a conflict review queue for Emergency Operators, and SQLCipher database encryption for mobile local storage.

## 10. PostGIS Single Point of Failure Mitigation
- **The Flaw**: Heavy spatial queries (`ST_DWithin`) on PostGIS under telemetry load threaten database performance.
- **Specific Gaps**:
  - Redis outage falls back directly to expensive PostGIS queries.
- **Fix Strategy**: Implement Redis Spatial Indexing (`GEOADD` / `GEORADIUS`) for live locations, spatial index optimization in PostgreSQL, and fallback caching.
