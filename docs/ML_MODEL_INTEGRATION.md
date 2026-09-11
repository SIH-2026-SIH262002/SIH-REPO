# Machine Learning Model Extraction & Backend Integration

## 1. Source Provenance

| Property | Value |
|---|---|
| **Source Branch** | `remotes/origin/adrish` |
| **Source Commit** | `8ad3de2109792d365179c384ab0a5fb979554115` |
| **Commit Message** | `feat(ml): retrain landslide model as XGBoost+LightGBM ensemble; fix web-dashboard API routing bugs` |
| **Model Artifact** | `ml/model_bundle.joblib` |
| **Git Blob Hash** | `ae767f6c9813fb4c35b0affe1b118ca706ca8acc` |
| **Artifact Size** | `9,857,637 bytes` (~9.4 MB) |
| **Trained Dataset** | `NER_SIH26002_320K_same_parameters.csv` (320,001 rows) |

---

## 2. Model Architecture & Specifications

The extracted model is a dual-ensemble machine learning architecture combining **XGBoost** and **LightGBM** models for both continuous risk severity regression and binary landslide occurrence probability:

1. **Risk Regressor Ensemble**:
   - `xgboost`: `XGBRegressor(n_estimators=500, max_depth=7, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8)`
   - `lightgbm`: `LGBMRegressor(n_estimators=500, max_depth=7, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8)`
   - **Inference**: Blended mean of both predictions: `(XGB + LGBM) / 2.0`
   - **Performance**: MAE = **1.457**, $R^2$ = **0.974**

2. **Occurrence Classifier Ensemble**:
   - `xgboost`: `XGBClassifier(n_estimators=500, max_depth=6, scale_pos_weight=6.45, eval_metric="logloss")`
   - `lightgbm`: `LGBMClassifier(n_estimators=500, max_depth=6, scale_pos_weight=6.45)`
   - **Inference**: Blended probability: `mean([XGB.predict_proba, LGBM.predict_proba])`
   - **Performance**: ROC-AUC = **0.933**, Accuracy = **85.79%**, Recall on landslides = **85%**

---

## 3. Input Features & Preprocessing Pipeline

### Feature Order (14 Features)
The model strictly requires input columns in the following exact sequence:

```python
[
    'rainfall_mm_last_24h',
    'rainfall_mm_last_72h',
    'days_since_last_rainfall',
    'temperature_c',
    'humidity_pct',
    'soil_moisture_pct',
    'soil_porosity_index',
    'vibration_intensity',
    'slope_angle_deg',
    'vegetation_cover_pct',
    'distance_to_stream_km',
    'historical_landslide_count',
    'elevation_m',
    'soil_type_encoded'
]
```

### Preprocessing
- **Categorical Feature**: `soil_type` is transformed using `bundle["soil_encoder"]` (`sklearn.preprocessing.LabelEncoder`).
- **Allowed Soil Classes**:
  1. `Clayey` (encoded: 0)
  2. `Loamy` (encoded: 1)
  3. `Loose Debris/Scree` (encoded: 2)
  4. `Rocky/Compact` (encoded: 3)
  5. `Sandy-Loam` (encoded: 4)

---

## 4. Current Application Data Source Mapping

| ML Feature | Type | Valid Range | Current Application Source |
|---|---|---|---|
| `rainfall_mm_last_24h` | Float | $\ge 0$ mm | IoT Rain Gauge / Open-Meteo precipitation past 24h (`sensor.rainfall_mm_last_24h`) |
| `rainfall_mm_last_72h` | Float | $\ge 0$ mm | Cumulative 72-hour precipitation telemetry (`sensor.rainfall_mm_last_72h`) |
| `days_since_last_rainfall` | Integer | $\ge 0$ days | Meteorological history counter (`sensor.days_since_last_rainfall`) |
| `temperature_c` | Float | $-20$ to $60 ^\circ\text{C}$ | Ambient temperature sensor probe / weather service (`sensor.temperature_c`) |
| `humidity_pct` | Float | $0$ to $100\%$ | Relative humidity hygrometer sensor (`sensor.humidity_pct`) |
| `soil_moisture_pct` | Float | $0$ to $100\%$ | Frequency Domain Reflectometry (FDR) volumetric soil probe (`sensor.soil_moisture_pct`) |
| `soil_porosity_index` | Float | $0$ to $100$ | Geotechnical soil survey database profile for station node location |
| `vibration_intensity` | Float | $0$ to $10$ m/s$^2$ | MEMS 3-axis accelerometer vibration sensor (`sensor.vibration_intensity`) |
| `slope_angle_deg` | Float | $0$ to $90^\circ$ | Topographic Digital Elevation Model (DEM) / inclinometer (`sensor.slope_angle_deg`) |
| `vegetation_cover_pct` | Float | $0$ to $100\%$ | Sentinel-2 NDVI satellite vegetation index for station grid cell |
| `distance_to_stream_km` | Float | $\ge 0$ km | GIS hydrological drainage proximity layer |
| `historical_landslide_count` | Integer | $\ge 0$ | Geological Survey of India (GSI) landslide inventory database |
| `elevation_m` | Float | $\ge 0$ m | Barometric altimeter / GPS altitude AMSL (`sensor.elevation_m`) |
| `soil_type` | String | 5 classes | Regional pedological geotechnical map classification (`sensor.soil_type`) |

> [!IMPORTANT]
> **Zero Fallback Fabrication Policy**: If any required input feature is missing or null, the service raises:
> `Prediction unavailable — required input data is unavailable. Missing fields: [...]`
> No random scores, default `50` values, or fabricated fallbacks are ever returned.

---

## 5. Output Specification

The model outputs an authoritative operational payload:

```json
{
  "risk_score": 86.1,
  "occurrence_probability": 0.999,
  "category": "SEVERE"
}
```

### Risk Category Bands
- **`SEVERE`**: $\text{Score} \ge 70.0$
- **`HIGH`**: $50.0 \le \text{Score} < 70.0$
- **`MODERATE`**: $25.0 \le \text{Score} < 50.0$
- **`LOW`**: $\text{Score} < 25.0$

---

## 6. Current Backend Integration Path

```text
Current Application (Sensors / Dashboard / Route Planner / API Request)
                  ↓
          [Pydantic Validation] (backend/app/routers/risk.py)
                  ↓
       [Authoritative ML Service] (backend/app/services/ml_service.py)
                  ↓
           [Cached In-Memory Model Bundle] (ml/model_bundle.joblib)
                  ↓
     [XGBoost + LightGBM Blended Inference]
                  ↓
        Real Risk Assessment (Score, Prob, Category)
```

### Endpoints
- `POST /api/risk/predict` — Evaluates risk for input payload (Requires JWT Auth).
- `POST /api/predict` — Alias route for core-service / internal microservices.
- `GET /api/risk/feature-importance` — Returns blended feature importance dictionary.
- `GET /api/risk/model-info` — Returns model name, metrics, and feature importances.

---

## 7. Verification: Original Branch vs Integrated Model

Every hand-crafted ground-truth scenario from `ml/simulation_results.json` was tested against both the original branch blob and the integrated backend service:

| Scenario | Location / Context | Original Branch Output | Integrated Service Output | Match |
|---|---|---|---|:---:|
| **Dry-Season Baseline** | Kohima, Nagaland (Dec-Jan dry stable slope) | Score: `6.9`, Prob: `0.002`, `LOW` | Score: `6.9`, Prob: `0.002`, `LOW` | **100% IDENTICAL** |
| **Pre-Monsoon Moderate Rain** | Kamrup Metro, Assam (Early monsoon onset) | Score: `16.4`, Prob: `0.022`, `LOW` | Score: `16.4`, Prob: `0.022`, `LOW` | **100% IDENTICAL** |
| **Monsoon Storm Event** | Jowai, West Jaintia Hills (Heavy rainfall, saturated slope) | Score: `86.1`, Prob: `0.999`, `SEVERE` | Score: `86.1`, Prob: `0.999`, `SEVERE` | **100% IDENTICAL** |
| **Extreme Landslide Trigger** | Nongpoh, Ri-Bhoi (Worst-case cloudburst trigger) | Score: `90.1`, Prob: `1.000`, `SEVERE` | Score: `90.1`, Prob: `1.000`, `SEVERE` | **100% IDENTICAL** |
| **Post-Storm Recovery** | Dima Hasao, Assam (Rain stopped, draining slope) | Score: `22.7`, Prob: `0.175`, `LOW` | Score: `22.7`, Prob: `0.175`, `LOW` | **100% IDENTICAL** |
| **Steep Slope, Dry Ground** | Synthetic Edge Case (Steep slope without rain) | Score: `11.2`, Prob: `0.005`, `LOW` | Score: `11.2`, Prob: `0.005`, `LOW` | **100% IDENTICAL** |

---

## 8. Files Imported vs Files NOT Imported

### Files Imported (Model-Specific Only)
- `ml/model_bundle.joblib` (9,857,637 bytes — the trained XGBoost + LightGBM ensemble).
- `ml/training_metrics.json` (model metrics metadata: MAE 1.457, R^2 0.974, ROC-AUC 0.933, accuracy 85.79%).
- `ml/simulate_scenarios.py` (validation test harness).
- `ml/simulation_results.json` (expected output ground truth).

### Files Explicitly NOT Imported
- **NO Frontend Code**: Did NOT import any web-dashboard components, pages, routing, CSS, or `AuthContext.tsx` bypasses.
- **NO Mobile App Code**: Did NOT import mobile-app shake alarms, UI redesigns, or root navigator modifications.
- **NO Unrelated Backend Architecture**: Did NOT import routers, controllers, or services unrelated to model inference.
- **NO Database Schemas**: Preserved the main branch SQLite and PostgreSQL database structures.
- **NO Authentication / Authorization Changes**: Maintained our authoritative JWT security model.
- **NO Git History Merge**: Never executed `git merge`, `git reset`, or `git cherry-pick`.
