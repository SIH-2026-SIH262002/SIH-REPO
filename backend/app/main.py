import asyncio
import os

from dotenv import load_dotenv, find_dotenv

# Load backend dedicated .env file
backend_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
root_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path, override=True)
elif os.path.exists(root_env_path):
    load_dotenv(root_env_path, override=True)
else:
    load_dotenv(find_dotenv(usecwd=True))

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.services import simulation_service, notify_service, vehicle_service, ml_service
from app.routers import sensors, risk, routes, sos, reports, alerts, dashboard, vehicles, notify, i18n, intelligence, auth
from app import ws

app = FastAPI(
    title="NER LogiSense API",
    description="AI-based Smart Logistics and Accessibility Intelligence Platform for the North Eastern Region",
    version="0.1.0",
)

origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(sensors.router)
app.include_router(risk.router)
app.include_router(routes.router)
app.include_router(sos.router)
app.include_router(reports.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(vehicles.router)
app.include_router(notify.router)
app.include_router(i18n.router)
app.include_router(intelligence.router)
app.include_router(ws.router)

@app.post("/api/predict", tags=["risk"])
async def predict_alias(request: Request):
    """
    Inter-service ML prediction endpoint. Supports both:
    1. Direct sensor reading payload
    2. Java core-service MlPredictionRequest (with nested 'features' map)
    """
    body = await request.json()
    f = body.get("features") if isinstance(body.get("features"), dict) else body

    rainfall_24h = f.get("rainfall24h", f.get("rainfall_mm_last_24h", 25.0))
    rainfall_72h = f.get("rainfall72h", f.get("rainfall_mm_last_72h", float(rainfall_24h) * 2.2))

    payload = {
        "rainfall_mm_last_24h": float(rainfall_24h),
        "rainfall_mm_last_72h": float(rainfall_72h),
        "days_since_last_rainfall": int(f.get("daysSinceLastRainfall", f.get("days_since_last_rainfall", 0))),
        "temperature_c": float(f.get("temperature", f.get("temperature_c", 25.0))),
        "humidity_pct": float(f.get("humidity", f.get("humidity_pct", 75.0))),
        "soil_moisture_pct": float(f.get("soilMoisture", f.get("soil_moisture_pct", 45.0))),
        "soil_porosity_index": float(f.get("soilPorosity", f.get("soil_porosity_index", 40.0))),
        "vibration_intensity": float(f.get("vibration", f.get("vibration_intensity", 1.2))),
        "slope_angle_deg": float(f.get("slopeDegrees", f.get("slope_angle_deg", 25.0))),
        "vegetation_cover_pct": float(f.get("vegetationCover", f.get("vegetation_cover_pct", 40.0))),
        "distance_to_stream_km": float(f.get("distanceToStream", f.get("distance_to_stream_km", 1.2))),
        "historical_landslide_count": int(f.get("historicalLandslideCount", f.get("historical_landslide_count", 0))),
        "elevation_m": float(f.get("elevation", f.get("elevation_m", 600.0))),
        "soil_type": str(f.get("soilType", f.get("soil_type", "Loamy"))),
    }

    try:
        raw_pred = ml_service.predict_risk(payload)
        window_hours = int(body.get("predictionWindowHours", 2))
        lang = risk.resolve_language(
            request.query_params.get("lang"),
            body.get("lang"),
            request.headers.get("accept-language"),
        )
        return risk.build_prediction_response(raw_pred, window_hours=window_hours, lang=lang)
    except ValueError as e:
        return {
            "available": False,
            "risk_score": None,
            "message": str(e)
        }
    except Exception:
        return {
            "available": False,
            "risk_score": None,
            "message": "Prediction unavailable — model execution failed."
        }

_background_tasks: list[asyncio.Task] = []


@app.on_event("startup")
async def startup():
    simulation_service.init_state()
    vehicle_service.init_vehicles()

    async def vehicle_loop():
        tick_seconds = 3.0
        dt_hours = tick_seconds / 3600 * 200  # sped up ~200x so a demo trip finishes in minutes
        while True:
            vehicle_service.tick_vehicles(dt_hours)
            await asyncio.sleep(tick_seconds)

    _background_tasks.append(asyncio.create_task(simulation_service.run_forever()))
    _background_tasks.append(asyncio.create_task(vehicle_loop()))
    _background_tasks.append(asyncio.create_task(notify_service.flush_outbox_forever()))


@app.on_event("shutdown")
async def shutdown():
    for t in _background_tasks:
        t.cancel()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "NER LogiSense API"}
