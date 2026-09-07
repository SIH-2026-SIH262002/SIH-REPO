"""
Trains modern Gradient Boosted Decision Tree (XGBoost / LightGBM) models for the backend ML service.

Two models are trained on the feature set from data/ner_landslide_sensor_dataset.xlsx:
  1. risk_regressor      -> predicts continuous landslide risk_score (0-100)
  2. occurrence_classifier -> predicts P(landslide_occurred) for thresholding & alerts

RandomForest has been replaced with modern Gradient Boosted Trees for superior accuracy and XAI explainability.
Saved to ml/model_bundle.joblib and training_metrics.json.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, roc_auc_score, classification_report
from sklearn.preprocessing import LabelEncoder

# Try modern XGBoost or LightGBM, fallback to Scikit-Learn GradientBoosting
MODEL_NAME = "Gradient Boosted Trees"
try:
    from xgboost import XGBRegressor, XGBClassifier
    USE_XGBOOST = True
    MODEL_NAME = "XGBoost Gradient Boosting"
except ImportError:
    USE_XGBOOST = False

try:
    from lightgbm import LGBMRegressor, LGBMClassifier
    USE_LIGHTGBM = True
    if not USE_XGBOOST:
        MODEL_NAME = "LightGBM Gradient Boosting"
except ImportError:
    USE_LIGHTGBM = False

if not USE_XGBOOST and not USE_LIGHTGBM:
    from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
    MODEL_NAME = "Gradient Boosting Decision Trees"

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ner_landslide_sensor_dataset.xlsx")
BUNDLE_PATH = os.path.join(os.path.dirname(__file__), "model_bundle.joblib")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "training_metrics.json")

NUMERIC_FEATURES = [
    "rainfall_mm_last_24h",
    "rainfall_mm_last_72h",
    "days_since_last_rainfall",
    "temperature_c",
    "humidity_pct",
    "soil_moisture_pct",
    "soil_porosity_index",
    "vibration_intensity",
    "slope_angle_deg",
    "vegetation_cover_pct",
    "distance_to_stream_km",
    "historical_landslide_count",
    "elevation_m",
]
CATEGORICAL_FEATURES = ["soil_type"]
FEATURES = NUMERIC_FEATURES + ["soil_type_encoded"]

print(f"Loading dataset from {DATA_PATH}...")
if not os.path.exists(DATA_PATH):
    print("Dataset not found. Generating dataset first...")
    import subprocess
    gen_script = os.path.join(os.path.dirname(__file__), "..", "data", "generate_dataset.py")
    subprocess.run(["python", gen_script], check=True)

df = pd.read_excel(DATA_PATH, sheet_name="Sensor_Readings")

soil_encoder = LabelEncoder()
df["soil_type_encoded"] = soil_encoder.fit_transform(df["soil_type"])

X = df[FEATURES]
y_risk = df["risk_score"]
y_occ = df["landslide_occurred"]

X_train, X_test, yr_train, yr_test, yo_train, yo_test = train_test_split(
    X, y_risk, y_occ, test_size=0.2, random_state=42, stratify=y_occ
)

print(f"Training modern ML Regressor ({MODEL_NAME})...")
if USE_XGBOOST:
    regressor = XGBRegressor(
        n_estimators=350, max_depth=6, learning_rate=0.05, random_state=42, n_jobs=-1
    )
elif USE_LIGHTGBM:
    regressor = LGBMRegressor(
        n_estimators=350, max_depth=6, learning_rate=0.05, random_state=42, n_jobs=-1
    )
else:
    regressor = GradientBoostingRegressor(
        n_estimators=250, max_depth=6, learning_rate=0.05, random_state=42
    )

regressor.fit(X_train, yr_train)
pred_risk = regressor.predict(X_test)
mae = mean_absolute_error(yr_test, pred_risk)
r2 = r2_score(yr_test, pred_risk)
print(f"  MAE={mae:.2f}  R2={r2:.3f}")

print(f"Training modern ML Classifier ({MODEL_NAME})...")
if USE_XGBOOST:
    classifier = XGBClassifier(
        n_estimators=350, max_depth=5, learning_rate=0.05, random_state=42, n_jobs=-1, eval_metric="logloss"
    )
elif USE_LIGHTGBM:
    classifier = LGBMClassifier(
        n_estimators=350, max_depth=5, learning_rate=0.05, random_state=42, n_jobs=-1
    )
else:
    classifier = GradientBoostingClassifier(
        n_estimators=250, max_depth=5, learning_rate=0.05, random_state=42
    )

classifier.fit(X_train, yo_train)
pred_proba = classifier.predict_proba(X_test)[:, 1]
pred_class = classifier.predict(X_test)
auc = roc_auc_score(yo_test, pred_proba)
report = classification_report(yo_test, pred_class, output_dict=True)
print(f"  ROC-AUC={auc:.3f}")

feature_importance = dict(
    sorted(zip(FEATURES, regressor.feature_importances_), key=lambda kv: -kv[1])
)
print("\nTop Landslide Risk Factors (Feature Importances):")
for k, v in list(feature_importance.items())[:6]:
    print(f"  {k:28s} {v:.4f}")

bundle = {
    "model_name": MODEL_NAME,
    "regressor": regressor,
    "classifier": classifier,
    "soil_encoder": soil_encoder,
    "numeric_features": NUMERIC_FEATURES,
    "categorical_features": CATEGORICAL_FEATURES,
    "feature_order": FEATURES,
    "soil_type_classes": list(soil_encoder.classes_),
    "metrics": {
        "mae": round(float(mae), 3),
        "r2": round(float(r2), 3),
        "roc_auc": round(float(auc), 3)
    }
}
joblib.dump(bundle, BUNDLE_PATH)
print(f"\nSaved modern ML model bundle -> {BUNDLE_PATH}")

metrics = {
    "model_name": MODEL_NAME,
    "regressor_mae": round(float(mae), 3),
    "regressor_r2": round(float(r2), 3),
    "classifier_roc_auc": round(float(auc), 3),
    "classifier_report": report,
    "feature_importance": {k: float(v) for k, v in feature_importance.items()},
    "n_train": len(X_train),
    "n_test": len(X_test),
}
with open(METRICS_PATH, "w") as f:
    json.dump(metrics, f, indent=2)
print(f"Saved metrics -> {METRICS_PATH}")
