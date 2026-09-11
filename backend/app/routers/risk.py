from pydantic import BaseModel, Field
from fastapi import APIRouter

from app.services import ml_service

router = APIRouter(prefix="/api/risk", tags=["risk"])


class RiskInput(BaseModel):
    rainfall_mm_last_24h: float = Field(..., ge=0)
    rainfall_mm_last_72h: float = Field(..., ge=0)
    days_since_last_rainfall: int = Field(0, ge=0)
    temperature_c: float = 25
    humidity_pct: float = Field(70, ge=0, le=100)
    soil_moisture_pct: float = Field(..., ge=0, le=100)
    soil_porosity_index: float = Field(..., ge=0, le=100)
    vibration_intensity: float = Field(..., ge=0, le=10)
    slope_angle_deg: float = Field(..., ge=0, le=90)
    vegetation_cover_pct: float = Field(40, ge=0, le=100)
    distance_to_stream_km: float = Field(1.0, ge=0)
    historical_landslide_count: int = Field(0, ge=0)
    elevation_m: float = 500
    soil_type: str = "Loamy"


@router.post("/predict")
def predict(payload: RiskInput):
    return ml_service.predict_risk(payload.model_dump())


@router.get("/feature-importance")
def importance():
    return ml_service.feature_importances()


@router.get("/model-info")
def model_info():
    return ml_service.get_model_info()
