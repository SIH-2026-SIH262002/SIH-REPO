from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Header, Query

from app.services import ml_service
from app.auth import get_current_user
from app.translations import localize_prediction, LANGUAGES

router = APIRouter(prefix="/api/risk", tags=["risk"])


class RiskInput(BaseModel):
    rainfall_mm_last_24h: float = Field(..., ge=0)
    rainfall_mm_last_72h: float = Field(..., ge=0)
    days_since_last_rainfall: int = Field(0, ge=0)
    temperature_c: float = 25.0
    humidity_pct: float = Field(70.0, ge=0, le=100)
    soil_moisture_pct: float = Field(..., ge=0, le=100)
    soil_porosity_index: float = Field(..., ge=0, le=100)
    vibration_intensity: float = Field(..., ge=0, le=10)
    slope_angle_deg: float = Field(..., ge=0, le=90)
    vegetation_cover_pct: float = Field(40.0, ge=0, le=100)
    distance_to_stream_km: float = Field(1.0, ge=0)
    historical_landslide_count: int = Field(0, ge=0)
    elevation_m: float = 500.0
    soil_type: str = "Loamy"
    lang: Optional[str] = Field(None, description="Target language code: en, hi, as, bn, mn, mz")


def build_prediction_response(
    pred: Dict[str, Any],
    window_hours: int = 2,
    lang: str = "en",
) -> Dict[str, Any]:
    """Formats prediction into an authoritative payload compatible with all clients and localized in 6 languages."""
    score = pred["risk_score"]
    prob = pred["occurrence_probability"]
    category = pred["category"]

    level_map = {
        "SEVERE": "CRITICAL",
        "HIGH": "HIGH",
        "MODERATE": "MEDIUM",
        "LOW": "LOW",
    }
    predicted_level = level_map.get(category, "LOW")

    impact_rating = "CRITICAL" if category in ("HIGH", "SEVERE") else "MEDIUM" if category == "MODERATE" else "LOW"
    raw_top_factors = [
        {"factor": "soil_moisture_pct", "impact": impact_rating},
        {"factor": "rainfall_mm_last_72h", "impact": impact_rating},
        {"factor": "vibration_intensity", "impact": "HIGH" if category in ("HIGH", "SEVERE") else "LOW"},
    ]

    loc = localize_prediction(category, score, prob, raw_top_factors, lang=lang)

    return {
        # Core Frontend & REST API properties
        "risk_score": score,
        "occurrence_probability": prob,
        "category": category,
        "category_localized": loc["category_localized"],
        "language": loc["language"],

        # Microservice & Governance properties
        "available": True,
        "modelName": "XGBoost + LightGBM Ensemble",
        "modelVersion": "2.0-ensemble",
        "predictionWindow": f"NEXT_{window_hours}_HOURS",
        "disruptionProbability": prob,
        "predictedRiskLevel": predicted_level,
        "topFactors": loc["top_factors_localized"],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "message": loc["message_localized"],
    }


def resolve_language(
    query_lang: Optional[str] = None,
    payload_lang: Optional[str] = None,
    accept_language: Optional[str] = None,
) -> str:
    """Extracts preferred language from query param, payload body, or Accept-Language header."""
    if query_lang and query_lang.lower().strip() in LANGUAGES:
        return query_lang.lower().strip()
    if payload_lang and payload_lang.lower().strip() in LANGUAGES:
        return payload_lang.lower().strip()
    if accept_language:
        # e.g. "hi-IN,hi;q=0.9,en;q=0.8" -> "hi"
        for part in accept_language.split(","):
            candidate = part.split(";")[0].split("-")[0].strip().lower()
            if candidate in LANGUAGES:
                return candidate
    return "en"


@router.post("/predict")
def predict(
    payload: RiskInput,
    user: dict = Depends(get_current_user),
    lang: Optional[str] = Query(None),
    accept_language: Optional[str] = Header(None, alias="Accept-Language"),
):
    """Runs real XGBoost + LightGBM ensemble inference against sensor readings with multi-lingual localization."""
    try:
        raw_pred = ml_service.predict_risk(payload.model_dump())
        resolved_lang = resolve_language(lang, payload.lang, accept_language)
        return build_prediction_response(raw_pred, lang=resolved_lang)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Prediction unavailable — model execution failed."
        )


@router.get("/feature-importance")
def importance(user: dict = Depends(get_current_user)):
    """Returns normalized blended feature importances from the ensemble."""
    try:
        return ml_service.feature_importances()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Feature importance unavailable — model execution failed."
        )


@router.get("/model-info")
def model_info(user: dict = Depends(get_current_user)):
    """Returns model name, verification metrics, and feature importances."""
    try:
        return ml_service.get_model_info()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Model info unavailable — model execution failed."
        )
