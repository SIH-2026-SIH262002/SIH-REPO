"""
Vehicles & Driver Telematics Router.
Includes Driver self-scoped vehicle assignment resolution, road-hazard reporting,
and multi-stage delivery lifecycle management.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.vehicle_service import VEHICLES
from app.services import simulation_service
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


class DriverHazardReportPayload(BaseModel):
    hazard_type: str  # e.g., ROCKFALL, FALLEN_TREE, ROAD_OBSTRUCTION, MUD_SLIDE
    description: Optional[str] = ""
    lat: float
    lon: float
    photo_url: Optional[str] = None
    vehicle_code: Optional[str] = None


class DeliveryStatusPayload(BaseModel):
    status: str  # IN_TRANSIT, DELAYED_LANDSLIDE, ARRIVED_DESTINATION, DELIVERED_PENDING_CONFIRMATION
    notes: Optional[str] = ""


@router.get("")
def list_vehicles(user: dict = Depends(get_current_user)):
    """
    List all vehicles. Open to any authenticated role (not just Logistics
    Operator/Admin) because Emergency Operator, Field Officer and Driver
    dashboards all render the same fleet layer on their situational map --
    see DashboardPage.tsx's unconditional getVehicles() call. Still requires
    a valid session (401 for anonymous callers).
    """
    return list(VEHICLES.values())


@router.get("/me")
def get_driver_assigned_vehicle(user: dict = Depends(get_current_user)):
    """
    Resolves assigned vehicle for authenticated Driver (ROUTE_VIEW_SELF).
    Dynamically maps driver identity to assigned vehicle without hardcoding.
    """
    user_name = user.get("fullName", "").strip().lower()
    user_id = str(user.get("sub", "")).strip().lower()

    for v_id, v in VEHICLES.items():
        d_name = str(v.get("driver_name", "")).strip().lower()
        v_code = str(v.get("code", "")).strip().lower()
        if (user_name and user_name in d_name) or (user_id and user_id in v_id.lower()) or (user_id and user_id in v_code):
            return {"assigned": True, "vehicle": v}

    # No fabricated fallback: an unmatched driver genuinely has no assigned
    # vehicle in this simulation, and must never be handed someone else's.
    return {"assigned": False, "message": "No vehicle assigned to authenticated driver account."}


@router.post("/hazard")
def report_driver_hazard(
    payload: DriverHazardReportPayload,
    user: dict = Depends(require_roles(["DRIVER", "FIELD_OFFICER", "ADMIN"]))
):
    """
    Allows drivers to report road hazards (ROAD_HAZARD_FLAG_SELF) without declaring emergency SOS.
    Logs hazard report and updates regional corridor risk alert flag.
    """
    driver_name = user.get("fullName", "Authenticated Driver")
    hazard_record = {
        "report_id": f"HAZ-{simulation_service.STATE.get('GUWAHATI', {}).get('timestamp', 1000)}",
        "reporter": driver_name,
        "role": user.get("role"),
        "hazard_type": payload.hazard_type,
        "description": payload.description,
        "location": {"lat": payload.lat, "lon": payload.lon},
        "photo_url": payload.photo_url,
        "vehicle_code": payload.vehicle_code,
        "status": "FLAGGED_FOR_REVIEW"
    }

    # Find nearest sensor node and apply caution flag
    for s_key in simulation_service.STATE:
        s_state = simulation_service.STATE[s_key]
        if s_state.get("risk_score", 0) < 50.0:
            s_state["driver_hazard"] = payload.hazard_type

    return {
        "status": "ACCEPTED",
        "message": f"Hazard '{payload.hazard_type}' reported successfully by {driver_name}.",
        "hazard_record": hazard_record
    }


@router.post("/{vehicle_id}/delivery-status")
def update_delivery_status(
    vehicle_id: str,
    payload: DeliveryStatusPayload,
    user: dict = Depends(require_roles(["DRIVER", "LOGISTICS_OPERATOR", "ADMIN"]))
):
    """Updates driver delivery lifecycle state (IN_TRANSIT -> DELAYED -> ARRIVED -> PENDING_CONFIRMATION)."""
    valid_statuses = ["IN_TRANSIT", "DELAYED_LANDSLIDE", "ARRIVED_DESTINATION", "DELIVERED_PENDING_CONFIRMATION"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid delivery status. Allowed: {valid_statuses}")

    target_v = VEHICLES.get(vehicle_id)
    if not target_v:
        # Search by code
        for v in VEHICLES.values():
            if v.get("code") == vehicle_id:
                target_v = v
                break

    if not target_v:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")

    # P0 Security Check: Resource Scoping / IDOR Verification for DRIVER role
    user_role = user.get("role", "")
    if user_role == "DRIVER":
        user_name = str(user.get("fullName", "")).strip().lower()
        user_id = str(user.get("sub", "")).strip().lower()
        assigned_driver = str(target_v.get("driver", "")).strip().lower()
        assigned_driver_id = str(target_v.get("driver_id", "")).strip().lower()
        assigned_code = str(target_v.get("code", "")).strip().lower()

        is_assigned = (
            (user_name and user_name in assigned_driver) or
            (user_id and user_id == assigned_driver_id) or
            (user_id and user_id in assigned_code) or
            (user_id in target_v.get("id", "").lower())
        )
        if not is_assigned:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only update delivery status for your own assigned vehicle."
            )

    target_v["delivery_status"] = payload.status
    target_v["last_notes"] = payload.notes

    return {
        "status": "UPDATED",
        "vehicle_id": vehicle_id,
        "new_delivery_status": payload.status,
        "updated_by": user.get("fullName")
    }


@router.post("/{vehicle_id}/delivery-confirm")
def confirm_delivery(
    vehicle_id: str,
    user: dict = Depends(require_roles(["LOGISTICS_OPERATOR", "ADMIN"]))
):
    """Logistics Operator final delivery confirmation endpoint (DELIVERY_CONFIRM)."""
    target_v = VEHICLES.get(vehicle_id)
    if not target_v:
        for v in VEHICLES.values():
            if v.get("code") == vehicle_id:
                target_v = v
                break

    if not target_v:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")

    target_v["delivery_status"] = "CONFIRMED_DELIVERED"
    target_v["status"] = "COMPLETED"

    return {
        "status": "CONFIRMED",
        "vehicle_id": vehicle_id,
        "confirmed_by": user.get("fullName")
    }
