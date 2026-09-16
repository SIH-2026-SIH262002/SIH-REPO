"""
Manual test-case simulator for the trained landslide risk ensemble
(ml/model_bundle.joblib). Feeds a set of hand-crafted sensor/weather
scenarios -- spanning dry-season baseline through an extreme monsoon
landslide trigger -- through the real XGBoost+LightGBM ensemble and
prints/saves the model's predictions for each one.

Run:  python ml/simulate_scenarios.py
Writes: ml/simulation_results.json
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

BUNDLE_PATH = os.path.join(os.path.dirname(__file__), "model_bundle.joblib")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "simulation_results.json")

bundle = joblib.load(BUNDLE_PATH)
soil_encoder = bundle["soil_encoder"]
feature_order = bundle["feature_order"]
numeric_features = bundle["numeric_features"]


def risk_category(score: float) -> str:
    if score >= 70:
        return "SEVERE"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MODERATE"
    return "LOW"


def predict(reading: dict) -> dict:
    row = {k: reading[k] for k in numeric_features}
    soil_type = reading["soil_type"]
    row["soil_type_encoded"] = soil_encoder.transform([soil_type])[0]
    X = pd.DataFrame([row])[feature_order]

    risk_score = float(np.mean([m.predict(X)[0] for m in bundle["regressors"].values()]))
    risk_score = max(0.0, min(100.0, risk_score))
    occurrence_probability = float(np.mean([m.predict_proba(X)[0][1] for m in bundle["classifiers"].values()]))

    xgb_score = float(bundle["regressors"]["xgboost"].predict(X)[0])
    lgbm_score = float(bundle["regressors"]["lightgbm"].predict(X)[0])

    return {
        "risk_score": round(risk_score, 1),
        "occurrence_probability": round(occurrence_probability, 3),
        "category": risk_category(risk_score),
        "xgboost_risk_score": round(xgb_score, 1),
        "lightgbm_risk_score": round(lgbm_score, 1),
    }


# --- Hand-crafted test scenarios, spanning the full risk spectrum -------
SCENARIOS = [
    {
        "name": "Dry-Season Baseline",
        "location": "Kohima, Nagaland (representative)",
        "narrative": "Typical December-January conditions: little recent rain, dry compact soil, stable vegetated slope.",
        "reading": {
            "rainfall_mm_last_24h": 0.0,
            "rainfall_mm_last_72h": 2.5,
            "days_since_last_rainfall": 18,
            "temperature_c": 14.5,
            "humidity_pct": 48.0,
            "soil_moisture_pct": 18.0,
            "soil_porosity_index": 0.32,
            "vibration_intensity": 0.4,
            "slope_angle_deg": 22.0,
            "vegetation_cover_pct": 68.0,
            "distance_to_stream_km": 3.1,
            "historical_landslide_count": 0,
            "elevation_m": 1420.0,
            "soil_type": "Rocky/Compact",
        },
    },
    {
        "name": "Pre-Monsoon Moderate Rain",
        "location": "Kamrup Metro, Assam (representative)",
        "narrative": "Early monsoon onset: moderate rain over the last few days, soil starting to saturate, moderate slope.",
        "reading": {
            "rainfall_mm_last_24h": 18.0,
            "rainfall_mm_last_72h": 45.0,
            "days_since_last_rainfall": 0,
            "temperature_c": 26.0,
            "humidity_pct": 78.0,
            "soil_moisture_pct": 48.0,
            "soil_porosity_index": 0.45,
            "vibration_intensity": 1.6,
            "slope_angle_deg": 28.0,
            "vegetation_cover_pct": 45.0,
            "distance_to_stream_km": 1.4,
            "historical_landslide_count": 2,
            "elevation_m": 640.0,
            "soil_type": "Loamy",
        },
    },
    {
        "name": "Monsoon Storm Event",
        "location": "Jowai, West Jaintia Hills (representative)",
        "narrative": "Active monsoon storm: heavy 24h/72h rainfall, saturated soil, steep slope on loose debris.",
        "reading": {
            "rainfall_mm_last_24h": 95.0,
            "rainfall_mm_last_72h": 165.0,
            "days_since_last_rainfall": 0,
            "temperature_c": 21.0,
            "humidity_pct": 96.0,
            "soil_moisture_pct": 82.0,
            "soil_porosity_index": 0.58,
            "vibration_intensity": 3.2,
            "slope_angle_deg": 41.0,
            "vegetation_cover_pct": 30.0,
            "distance_to_stream_km": 0.6,
            "historical_landslide_count": 5,
            "elevation_m": 1290.0,
            "soil_type": "Loose Debris/Scree",
        },
    },
    {
        "name": "Extreme Landslide-Triggering Event",
        "location": "Nongpoh, Ri-Bhoi (representative -- matches the app's own demo hazard corridor)",
        "narrative": "Worst-case cloudburst on an already-saturated, steep, loose slope with a history of repeated slides -- the scenario the whole alert pipeline exists to catch.",
        "reading": {
            "rainfall_mm_last_24h": 145.0,
            "rainfall_mm_last_72h": 230.0,
            "days_since_last_rainfall": 0,
            "temperature_c": 19.5,
            "humidity_pct": 99.0,
            "soil_moisture_pct": 97.0,
            "soil_porosity_index": 0.62,
            "vibration_intensity": 4.6,
            "slope_angle_deg": 52.0,
            "vegetation_cover_pct": 18.0,
            "distance_to_stream_km": 0.2,
            "historical_landslide_count": 9,
            "elevation_m": 980.0,
            "soil_type": "Loose Debris/Scree",
        },
    },
    {
        "name": "Post-Storm Recovery (Transitional)",
        "location": "Dima Hasao, Assam (representative)",
        "narrative": "Rain has stopped for two days but the slope is still draining -- soil moisture and risk are elevated but falling.",
        "reading": {
            "rainfall_mm_last_24h": 3.0,
            "rainfall_mm_last_72h": 58.0,
            "days_since_last_rainfall": 2,
            "temperature_c": 22.0,
            "humidity_pct": 84.0,
            "soil_moisture_pct": 63.0,
            "soil_porosity_index": 0.50,
            "vibration_intensity": 1.9,
            "slope_angle_deg": 34.0,
            "vegetation_cover_pct": 36.0,
            "distance_to_stream_km": 0.9,
            "historical_landslide_count": 4,
            "elevation_m": 810.0,
            "soil_type": "Clayey",
        },
    },
    {
        "name": "Steep Slope, Dry Ground (Slope-Dominant Edge Case)",
        "location": "Synthetic edge case",
        "narrative": "Isolates slope/vibration risk from moisture risk: a very steep slope with essentially no rain, to check the model doesn't over-weight slope alone.",
        "reading": {
            "rainfall_mm_last_24h": 0.0,
            "rainfall_mm_last_72h": 1.0,
            "days_since_last_rainfall": 25,
            "temperature_c": 24.0,
            "humidity_pct": 55.0,
            "soil_moisture_pct": 15.0,
            "soil_porosity_index": 0.30,
            "vibration_intensity": 0.6,
            "slope_angle_deg": 55.0,
            "vegetation_cover_pct": 60.0,
            "distance_to_stream_km": 4.0,
            "historical_landslide_count": 0,
            "elevation_m": 1750.0,
            "soil_type": "Sandy-Loam",
        },
    },
]

results = []
print(f"Model: {bundle['model_name']}")
print(f"Reported test-set metrics: {bundle['metrics']}\n")
print(f"{'Scenario':38s} {'Risk':>6s} {'Category':>9s} {'P(slide)':>9s}")
print("-" * 68)
for sc in SCENARIOS:
    pred = predict(sc["reading"])
    print(f"{sc['name']:38s} {pred['risk_score']:6.1f} {pred['category']:>9s} {pred['occurrence_probability']*100:8.1f}%")
    results.append({**sc, "prediction": pred})

with open(OUTPUT_PATH, "w") as f:
    json.dump({"model_name": bundle["model_name"], "metrics": bundle["metrics"], "scenarios": results}, f, indent=2)
print(f"\nSaved full results -> {OUTPUT_PATH}")
