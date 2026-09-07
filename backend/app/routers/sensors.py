from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.simulation_service import (
    STATE,
    inject_storm_event,
    reset_simulation_state,
)

router = APIRouter(prefix="/api/sensors", tags=["sensors"])


class StormInjectionRequest(BaseModel):
    node_key: str = "silchar"
    rainfall_24h: float = 120.0
    vibration: float = 4.5
    duration_ticks: int = 10


@router.get("")
def list_sensors():
    return list(STATE.values())


@router.get("/{node_key}")
def get_sensor(node_key: str):
    node_key_upper = node_key.upper()
    if node_key_upper not in STATE:
        raise HTTPException(404, f"Unknown node '{node_key}'")
    return STATE[node_key_upper]


@router.post("/inject-storm")
def inject_storm(payload: StormInjectionRequest):
    result = inject_storm_event(
        node_key=payload.node_key,
        duration_ticks=payload.duration_ticks,
        rainfall_24h=payload.rainfall_24h,
        vibration=payload.vibration,
    )
    if not result:
        raise HTTPException(404, f"Unknown sensor node '{payload.node_key}'")
    return {
        "status": "success",
        "message": f"Storm event injected at {payload.node_key.upper()}",
        "node": result,
    }


@router.post("/reset-scenario")
def reset_scenario():
    return reset_simulation_state()
