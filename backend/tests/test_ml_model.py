"""
Unit and integration test suite for the extracted XGBoost + LightGBM Ensemble ML model.
Covers all 10 verification criteria:
  1. Model Load
  2. Preprocessing
  3. Valid Input Inference
  4. Invalid Input Validation
  5. Missing Input Error Handling
  6. Model Failure Handling
  7. API Prediction & Model Info Endpoints
  8. API Authorization Rejection
  9. Regression on 6 Ground-Truth Scenarios
  10. Original vs Integrated Numerical Equivalence
"""

import os
import json
import subprocess
import io
import joblib
import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import ml_service

_ctx = TestClient(app)
client = _ctx.__enter__()


def teardown_module(module):
    _ctx.__exit__(None, None, None)


ADMIN_CREDS = {"identifier": "admin@nerlogisense.gov.in", "password": "password123"}


def _get_auth_token():
    res = client.post("/api/auth/login", json=ADMIN_CREDS)
    assert res.status_code == 200, res.text
    return res.json()["accessToken"]


# ---------------------------------------------------------------------------
# Test 1 — Model Load
# ---------------------------------------------------------------------------
def test_model_load():
    bundle = ml_service._load()
    assert bundle is not None
    assert bundle.get("model_name") == "XGBoost + LightGBM Ensemble"
    assert "regressors" in bundle and "xgboost" in bundle["regressors"] and "lightgbm" in bundle["regressors"]
    assert "classifiers" in bundle and "xgboost" in bundle["classifiers"] and "lightgbm" in bundle["classifiers"]
    assert len(bundle.get("feature_order", [])) == 14
    assert len(bundle.get("soil_type_classes", [])) == 5


# ---------------------------------------------------------------------------
# Test 2 — Preprocessing
# ---------------------------------------------------------------------------
def test_preprocessing():
    bundle = ml_service._load()
    encoder = bundle["soil_encoder"]
    classes = bundle["soil_type_classes"]
    assert len(classes) == 5
    for c in classes:
        encoded = encoder.transform([c])[0]
        assert isinstance(int(encoded), int)
        assert 0 <= encoded < len(classes)


# ---------------------------------------------------------------------------
# Test 3 — Valid Input
# ---------------------------------------------------------------------------
def test_valid_input():
    sample_input = {
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
    }
    pred = ml_service.predict_risk(sample_input)
    assert "risk_score" in pred
    assert "occurrence_probability" in pred
    assert "category" in pred
    assert pred["risk_score"] == 6.9
    assert pred["occurrence_probability"] == 0.002
    assert pred["category"] == "LOW"


# ---------------------------------------------------------------------------
# Test 4 — Invalid Input Validation
# ---------------------------------------------------------------------------
def test_invalid_input_validation():
    token = _get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Slope > 90 degrees is impossible
    res = client.post(
        "/api/risk/predict",
        json={
            "rainfall_mm_last_24h": 10.0,
            "rainfall_mm_last_72h": 20.0,
            "soil_moisture_pct": 30.0,
            "soil_porosity_index": 40.0,
            "vibration_intensity": 1.0,
            "slope_angle_deg": 120.0,  # Invalid
        },
        headers=headers,
    )
    assert res.status_code == 422

    # Negative rainfall is impossible
    res = client.post(
        "/api/risk/predict",
        json={
            "rainfall_mm_last_24h": -5.0,  # Invalid
            "rainfall_mm_last_72h": 20.0,
            "soil_moisture_pct": 30.0,
            "soil_porosity_index": 40.0,
            "vibration_intensity": 1.0,
            "slope_angle_deg": 25.0,
        },
        headers=headers,
    )
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# Test 5 — Missing Input Handling
# ---------------------------------------------------------------------------
def test_missing_input():
    incomplete_input = {
        "rainfall_mm_last_24h": 10.0,
        # missing rainfall_mm_last_72h, soil_moisture_pct, etc.
        "soil_type": "Rocky/Compact",
    }
    with pytest.raises(ValueError, match="Prediction unavailable"):
        ml_service.predict_risk(incomplete_input)


# ---------------------------------------------------------------------------
# Test 6 — Model Failure Handling
# ---------------------------------------------------------------------------
def test_model_failure_handling():
    invalid_soil = {
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
        "soil_type": "NonExistentUnknownSoilType",
    }
    with pytest.raises(ValueError, match="Prediction unavailable"):
        ml_service.predict_risk(invalid_soil)


# ---------------------------------------------------------------------------
# Test 7 — API Endpoints
# ---------------------------------------------------------------------------
def test_api_endpoints():
    token = _get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. /api/risk/predict
    payload = {
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
    }
    res = client.post("/api/risk/predict", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_score"] == 16.4
    assert data["category"] == "LOW"
    assert data["occurrence_probability"] == 0.022

    # 2. /api/risk/feature-importance
    res_fi = client.get("/api/risk/feature-importance", headers=headers)
    assert res_fi.status_code == 200
    fi = res_fi.json()
    assert len(fi) == 14

    # 3. /api/risk/model-info
    res_info = client.get("/api/risk/model-info", headers=headers)
    assert res_info.status_code == 200
    info = res_info.json()
    assert info["model_name"] == "XGBoost + LightGBM Ensemble"
    assert info["metrics"]["r2"] == 0.974


# ---------------------------------------------------------------------------
# Test 8 — Authorization Enforced
# ---------------------------------------------------------------------------
def test_api_authorization():
    # No auth header -> 401 Unauthorized
    res = client.post("/api/risk/predict", json={})
    assert res.status_code == 401

    res = client.get("/api/risk/feature-importance")
    assert res.status_code == 401

    res = client.get("/api/risk/model-info")
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Test 9 — Regression on 6 Ground-Truth Scenarios
# ---------------------------------------------------------------------------
def test_regression_known_scenarios():
    sim_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "ml", "simulation_results.json")
    )
    with open(sim_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for sc in data["scenarios"]:
        name = sc["name"]
        reading = sc["reading"]
        expected = sc["prediction"]
        actual = ml_service.predict_risk(reading)

        assert actual["risk_score"] == expected["risk_score"], f"Risk score mismatch on {name}"
        assert (
            actual["occurrence_probability"] == expected["occurrence_probability"]
        ), f"Occurrence probability mismatch on {name}"
        assert actual["category"] == expected["category"], f"Category mismatch on {name}"


# ---------------------------------------------------------------------------
# Test 10 — Original vs Integrated Model Equivalence
# ---------------------------------------------------------------------------
def test_original_vs_integrated_comparison():
    # Extract original blob directly from git
    cmd = ["git", "cat-file", "blob", "ae767f6c9813fb4c35b0affe1b118ca706ca8acc"]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, check=True)
    orig_bundle = joblib.load(io.BytesIO(proc.stdout))

    sim_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "ml", "simulation_results.json")
    )
    with open(sim_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for sc in data["scenarios"]:
        reading = sc["reading"]

        # Run inference using original git blob in-memory
        row = {k: reading[k] for k in orig_bundle["numeric_features"]}
        row["soil_type_encoded"] = orig_bundle["soil_encoder"].transform([reading["soil_type"]])[0]
        X = pd.DataFrame([row])[orig_bundle["feature_order"]]

        orig_score = round(
            float(
                max(
                    0.0,
                    min(100.0, np.mean([m.predict(X)[0] for m in orig_bundle["regressors"].values()])),
                )
            ),
            1,
        )
        orig_prob = round(
            float(np.mean([m.predict_proba(X)[0][1] for m in orig_bundle["classifiers"].values()])),
            3,
        )

        # Run inference using integrated service
        integrated_pred = ml_service.predict_risk(reading)

        assert integrated_pred["risk_score"] == orig_score
        assert integrated_pred["occurrence_probability"] == orig_prob


# ---------------------------------------------------------------------------
# Test 11 — Inter-Service Microservice Endpoint (/api/predict)
# ---------------------------------------------------------------------------
def test_inter_service_predict_endpoint():
    # 1. Direct sensor reading payload
    payload = {
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
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["available"] is True
    assert data["risk_score"] == 86.1
    assert data["category"] == "SEVERE"
    assert data["predictedRiskLevel"] == "CRITICAL"
    assert data["disruptionProbability"] == 0.999
    assert len(data["topFactors"]) > 0

    # 2. Java Spring Boot core-service MlPredictionRequest payload
    java_payload = {
        "latitude": 25.18,
        "longitude": 92.93,
        "predictionWindowHours": 2,
        "features": {
            "rainfall24h": 95.0,
            "rainfall72h": 165.0,
            "soilMoisture": 82.0,
            "slopeDegrees": 41.0,
            "elevation": 1290.0,
            "soilType": "Loose Debris/Scree",
            "vibration": 3.2,
            "temperature": 21.0,
            "humidity": 96.0,
            "soilPorosity": 0.58,
            "vegetationCover": 30.0,
            "distanceToStream": 0.6,
            "historicalLandslideCount": 5,
            "daysSinceLastRainfall": 0,
        },
    }
    res_java = client.post("/api/predict", json=java_payload)
    assert res_java.status_code == 200
    data_java = res_java.json()
    assert data_java["available"] is True
    assert data_java["risk_score"] == 86.1
    assert data_java["predictedRiskLevel"] == "CRITICAL"
    assert data_java["predictionWindow"] == "NEXT_2_HOURS"


# ---------------------------------------------------------------------------
# Test 12 — Multilingual Model Outputs (All 6 Regional Languages)
# ---------------------------------------------------------------------------
def test_multilingual_model_responses():
    token = _get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
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
    }

    # 1. Hindi (hi) via query param
    res_hi = client.post("/api/risk/predict?lang=hi", json=payload, headers=headers)
    assert res_hi.status_code == 200
    d_hi = res_hi.json()
    assert d_hi["language"] == "hi"
    assert d_hi["category_localized"] == "निम्न"
    assert "एक्सजीबूस्ट + लाइटजीबीएम" in d_hi["message"]
    assert d_hi["topFactors"][0]["factor_localized"] == "मृदा नमी संतृप्ति"

    # 2. Assamese (as) via query param
    res_as = client.post("/api/risk/predict?lang=as", json=payload, headers=headers)
    assert res_as.status_code == 200
    d_as = res_as.json()
    assert d_as["language"] == "as"
    assert d_as["category_localized"] == "নিম্ন"
    assert "বিপদৰ মূল্যায়ন কৰিছে" in d_as["message"]
    assert d_as["topFactors"][0]["factor_localized"] == "মাটিৰ আৰ্দ্ৰতা সংপৃক্ততা"

    # 3. Bengali (bn) via Accept-Language header
    h_bn = {**headers, "Accept-Language": "bn-IN,bn;q=0.9"}
    res_bn = client.post("/api/risk/predict", json=payload, headers=h_bn)
    assert res_bn.status_code == 200
    d_bn = res_bn.json()
    assert d_bn["language"] == "bn"
    assert d_bn["category_localized"] == "স্বল্প"
    assert "ঝুঁকি নির্ণয় করেছে" in d_bn["message"]

    # 4. Manipuri (mn) via body field
    res_mn = client.post("/api/risk/predict", json={**payload, "lang": "mn"}, headers=headers)
    assert res_mn.status_code == 200
    d_mn = res_mn.json()
    assert d_mn["language"] == "mn"
    assert d_mn["category_localized"] == "নেম্না"

    # 5. Mizo (mz) via query param
    res_mz = client.post("/api/risk/predict?lang=mz", json=payload, headers=headers)
    assert res_mz.status_code == 200
    d_mz = res_mz.json()
    assert d_mz["language"] == "mz"
    assert d_mz["category_localized"] == "Hniam"
    assert "dinhmun a chhut chhuak" in d_mz["message"]
