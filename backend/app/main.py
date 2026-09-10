import asyncio
import os

from dotenv import load_dotenv, find_dotenv

# Load unified master .env file from project root
root_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(root_env_path):
    load_dotenv(root_env_path, override=True)
else:
    load_dotenv(find_dotenv(usecwd=True))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.services import simulation_service, notify_service, vehicle_service
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
