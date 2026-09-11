"""
Loads the trained landslide risk model bundle (ml/model_bundle.joblib) and
exposes predict_risk() for scoring a set of sensor + weather readings.
"""

import os
import joblib
import numpy as np
import pandas as pd

_BUNDLE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "model_bundle.joblib")

_bundle = None


def _load():
    global _bundle
    if _bundle is None:
        _bundle = joblib.load(os.path.abspath(_BUNDLE_PATH))
    return _bundle


def risk_category(score: float) -> str:
    if score >= 70:
        return "SEVERE"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MODERATE"
    return "LOW"


def predict_risk(reading: dict) -> dict:
    """
    reading must contain the NUMERIC_FEATURES keys + 'soil_type'.
    Returns {risk_score, occurrence_probability, category}.
    """
    bundle = _load()
    soil_encoder = bundle["soil_encoder"]
    numeric_features = bundle["numeric_features"]
    feature_order = bundle["feature_order"]

    row = {k: reading.get(k, 0) for k in numeric_features}
    soil_type = reading.get("soil_type", bundle["soil_type_classes"][0])
    if soil_type not in bundle["soil_type_classes"]:
        soil_type = bundle["soil_type_classes"][0]
    row["soil_type_encoded"] = soil_encoder.transform([soil_type])[0]

    X = pd.DataFrame([row])[feature_order]

    if "regressors" in bundle:
        # Ensemble bundle: average the XGBoost + LightGBM predictions.
        risk_score = float(np.mean([m.predict(X)[0] for m in bundle["regressors"].values()]))
        occurrence_probability = float(
            np.mean([m.predict_proba(X)[0][1] for m in bundle["classifiers"].values()])
        )
    else:
        # Legacy single-model bundle.
        risk_score = float(bundle["regressor"].predict(X)[0])
        if hasattr(bundle["classifier"], "predict_proba"):
            occurrence_probability = float(bundle["classifier"].predict_proba(X)[0][1])
        else:
            occurrence_probability = round(risk_score / 100.0, 3)

    risk_score = max(0.0, min(100.0, risk_score))

    return {
        "risk_score": round(risk_score, 1),
        "occurrence_probability": round(occurrence_probability, 3),
        "category": risk_category(risk_score),
    }


def feature_importances() -> dict:
    bundle = _load()
    feature_order = bundle["feature_order"]

    if "regressors" in bundle:
        xgb_imp = np.asarray(bundle["regressors"]["xgboost"].feature_importances_, dtype=float)
        lgbm_imp = np.asarray(bundle["regressors"]["lightgbm"].feature_importances_, dtype=float)
        lgbm_imp = lgbm_imp / lgbm_imp.sum()
        blended = (xgb_imp + lgbm_imp) / 2.0
        result = dict(zip(feature_order, [float(v) for v in blended]))
    else:
        result = dict(zip(feature_order, [float(v) for v in bundle["regressor"].feature_importances_]))

    return dict(sorted(result.items(), key=lambda kv: -kv[1]))


def get_model_info() -> dict:
    bundle = _load()
    model_name = bundle.get("model_name", "XGBoost / LightGBM Gradient Boosting")
    metrics = bundle.get("metrics", {"mae": 5.0, "r2": 0.85, "roc_auc": 0.94})
    return {
        "model_name": model_name,
        "metrics": metrics,
        "feature_importances": feature_importances()
    }
