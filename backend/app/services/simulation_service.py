"""
Simulates a live network of field sensors (soil moisture + vibration/motion)
combined with weather data, and continuously re-scores every monitored node
through the trained ML model. This stands in for real hardware telemetry in
the prototype -- swap `read_physical_sensor()` for a real MQTT/LoRaWAN feed
later without touching any downstream code (routing, alerts, dashboard all
just read `STATE`).

An occasional random "storm event" is injected at a random node so the demo
can show the full pipeline reacting: risk climbs -> route auto-flags ->
alert fires -> notification dispatch is attempted.
"""

import asyncio
import random
import time
from datetime import datetime, timezone

from app.graph_data import NODES
from app.services import ml_service, weather_service, notify_service

SOIL_TYPES = ["Rocky/Compact", "Loamy", "Sandy-Loam", "Clayey", "Loose Debris/Scree"]

STATE: dict[str, dict] = {}
ALERTS: list[dict] = []
_subscribers: list[asyncio.Queue] = []

HIGH_RISK_THRESHOLD = 50
SEVERE_RISK_THRESHOLD = 70


def _init_node_state(node_key: str, node: dict) -> dict:
    return {
        "node_key": node_key,
        "sensor_node_id": node["sensor_node_id"],
        "name": node["name"],
        "district": node["district"],
        "state": node["state"],
        "lat": node["lat"],
        "lon": node["lon"],
        "soil_type": random.choice(SOIL_TYPES),
        "rainfall_mm_last_24h": round(random.uniform(2, 20), 1),
        "rainfall_mm_last_72h": round(random.uniform(10, 45), 1),
        "days_since_last_rainfall": random.randint(0, 4),
        "soil_moisture_pct": round(random.uniform(20, 40), 1),
        "soil_porosity_index": round(random.uniform(25, 55), 1),
        "vibration_intensity": round(random.uniform(0.5, 2.0), 2),
        "slope_angle_deg": round(random.uniform(10, 35), 1),
        "vegetation_cover_pct": round(random.uniform(35, 60), 1),
        "distance_to_stream_km": round(random.uniform(0.3, 4.0), 2),
        "historical_landslide_count": random.randint(0, 5),
        "elevation_m": random.randint(60, 1800),
        "temperature_c": round(random.uniform(18, 30), 1),
        "humidity_pct": round(random.uniform(55, 90), 1),
        "risk_score": 0.0,
        "occurrence_probability": 0.0,
        "category": "LOW",
        "storm_event": False,
        "storm_ticks_remaining": 0,
        "manual_flag": None,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


def init_state():
    for node_key, node in NODES.items():
        STATE[node_key] = _init_node_state(node_key, node)


def subscribe() -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=50)
    _subscribers.append(q)
    return q


def unsubscribe(q: asyncio.Queue):
    if q in _subscribers:
        _subscribers.remove(q)


def broadcast(event: dict):
    for q in list(_subscribers):
        try:
            q.put_nowait(event)
        except asyncio.QueueFull:
            pass


def _drift(value, lo, hi, step):
    value += random.uniform(-step, step)
    return max(lo, min(hi, value))


async def _tick_node(node_key: str):
    s = STATE[node_key]

    # randomly start/continue a storm event (heavy rain + saturating soil)
    if s["storm_ticks_remaining"] > 0:
        s["storm_event"] = True
        s["storm_ticks_remaining"] -= 1
        s["rainfall_mm_last_24h"] = _drift(s["rainfall_mm_last_24h"], 0, 220, 25)
        s["rainfall_mm_last_72h"] = min(400, s["rainfall_mm_last_72h"] + s["rainfall_mm_last_24h"] * 0.5)
        s["days_since_last_rainfall"] = 0
    else:
        s["storm_event"] = False
        if random.random() < 0.015:  # ~1.5% chance per tick a storm starts at this node
            s["storm_ticks_remaining"] = random.randint(4, 10)
        s["rainfall_mm_last_24h"] = _drift(s["rainfall_mm_last_24h"], 0, 40, 3)
        s["rainfall_mm_last_72h"] = max(s["rainfall_mm_last_24h"], _drift(s["rainfall_mm_last_72h"], 0, 60, 4))
        s["days_since_last_rainfall"] = s["days_since_last_rainfall"] + 1 if s["rainfall_mm_last_24h"] < 2 else 0

    weather = await weather_service.get_current_weather(s["lat"], s["lon"])
    if weather:
        s["temperature_c"] = weather.get("temperature_c", s["temperature_c"])
        s["humidity_pct"] = weather.get("humidity_pct", s["humidity_pct"])
        if weather.get("rain_1h_mm") is not None:
            s["rainfall_mm_last_24h"] = max(s["rainfall_mm_last_24h"], weather["rain_1h_mm"] * 6)

    porosity_factor = 0.6 + (s["soil_porosity_index"] / 100) * 0.9
    target_moisture = 15 + s["rainfall_mm_last_72h"] * 0.9 * porosity_factor - s["days_since_last_rainfall"] * 2.5
    s["soil_moisture_pct"] = max(5, min(100, s["soil_moisture_pct"] + (target_moisture - s["soil_moisture_pct"]) * 0.35))

    target_vibration = 0.6 + (s["soil_moisture_pct"] / 100) * 3.5 + (s["slope_angle_deg"] / 50) * 2.5
    s["vibration_intensity"] = max(0, min(10, s["vibration_intensity"] + (target_vibration - s["vibration_intensity"]) * 0.3 + random.uniform(-0.2, 0.2)))

    for k in ("rainfall_mm_last_24h", "rainfall_mm_last_72h", "soil_moisture_pct", "vibration_intensity"):
        s[k] = round(s[k], 1)

    prediction = ml_service.predict_risk(s)
    prev_category = s["category"]
    s.update(prediction)
    s["last_updated"] = datetime.now(timezone.utc).isoformat()

    if prediction["category"] in ("HIGH", "SEVERE") and prev_category not in ("HIGH", "SEVERE"):
        alert = {
            "id": f"ALT-{int(time.time() * 1000)}-{node_key}",
            "type": "AI_PREDICTED",
            "node_key": node_key,
            "node_name": s["name"],
            "district": s["district"],
            "risk_score": s["risk_score"],
            "category": s["category"],
            "message": f"AI model predicts {s['category']} landslide risk near {s['name']} ({s['district']}) "
                       f"- risk score {s['risk_score']}/100. Soil moisture {s['soil_moisture_pct']:.0f}%, "
                       f"72h rainfall {s['rainfall_mm_last_72h']:.0f}mm.",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "active": True,
        }
        ALERTS.insert(0, alert)
        del ALERTS[200:]
        broadcast({"kind": "alert", "data": alert})
        await notify_service.broadcast_route_danger(alert)

    broadcast({"kind": "sensor_update", "data": s})


def inject_storm_event(node_key: str, duration_ticks: int = 10, rainfall_24h: float = 120.0, vibration: float = 4.5):
    node_key = node_key.upper()
    if node_key in STATE:
        s = STATE[node_key]
        s["storm_event"] = True
        s["storm_ticks_remaining"] = duration_ticks
        s["rainfall_mm_last_24h"] = rainfall_24h
        s["rainfall_mm_last_72h"] = max(s["rainfall_mm_last_72h"], rainfall_24h * 1.5)
        s["soil_moisture_pct"] = min(95.0, s["soil_moisture_pct"] + 35.0)
        s["vibration_intensity"] = vibration
        s["days_since_last_rainfall"] = 0
        prediction = ml_service.predict_risk(s)
        s.update(prediction)
        s["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        alert = {
            "id": f"ALT-{int(time.time() * 1000)}-{node_key}",
            "type": "SIMULATED_STORM_INJECTED",
            "node_key": node_key,
            "node_name": s["name"],
            "district": s["district"],
            "risk_score": s["risk_score"],
            "category": s["category"],
            "message": f"CRITICAL STORM INJECTED at {s['name']} ({s['district']}). Risk score {s['risk_score']}/100.",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "active": True,
        }
        ALERTS.insert(0, alert)
        broadcast({"kind": "alert", "data": alert})
        broadcast({"kind": "sensor_update", "data": s})
        return s
    return None


def reset_simulation_state():
    init_state()
    ALERTS.clear()
    broadcast({"kind": "system_reset", "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"status": "reset_complete"}


async def run_forever(interval_seconds: float = 4.0):
    init_state()
    while True:
        await asyncio.gather(*(_tick_node(k) for k in NODES.keys()))
        await asyncio.sleep(interval_seconds)

