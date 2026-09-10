from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends

from app.services import vehicle_service, notify_service
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/sos", tags=["sos"])

# Numbers that get alerted whenever ANY sos comes in, in addition to district subscribers
EMERGENCY_CONTACTS = ["+919999900002", "+919999900001"]


class SOSInput(BaseModel):
    vehicle_id: str | None = None
    driver_name: str
    phone: str
    lat: float
    lon: float
    issue_type: str = "vehicle_breakdown"  # vehicle_breakdown | medical | road_blocked | accident | other
    message: str = ""


@router.post("")
async def send_sos(payload: SOSInput):
    event = vehicle_service.trigger_sos(
        payload.vehicle_id, payload.driver_name, payload.phone,
        payload.lat, payload.lon, payload.issue_type, payload.message,
    )
    text = (
        f"[SOS] {payload.driver_name} ({payload.phone}) needs help - {payload.issue_type.replace('_', ' ')}. "
        f"Location: {payload.lat:.4f},{payload.lon:.4f}. \"{payload.message}\" "
        f"Vehicle: {payload.vehicle_id or 'N/A'}."
    )
    dispatch = []
    for contact in EMERGENCY_CONTACTS:
        dispatch.append(notify_service.send_whatsapp(contact, text))
        dispatch.append(notify_service.send_sms(contact, text))
    return {"event": event, "notifications": dispatch}


@router.get("")
def list_sos(user: dict = Depends(require_roles(["EMERGENCY_OPERATOR", "ADMIN"]))):
    """P1 Fix: Returns SOS panic events filtered by user's assigned district for EMERGENCY_OPERATOR."""
    user_role = user.get("role", "")
    all_events = vehicle_service.SOS_EVENTS
    if user_role == "ADMIN":
        return all_events

    operator_district = str(user.get("district", "")).strip().lower()
    if not operator_district:
        return all_events

    filtered = []
    for ev in all_events:
        ev_district = str(ev.get("district", "") or ev.get("location_name", "")).strip().lower()
        if not ev_district or operator_district in ev_district or ev_district in operator_district:
            filtered.append(ev)
    return filtered


@router.post("/{sos_id}/resolve")
def resolve(sos_id: str, user: dict = Depends(require_roles(["EMERGENCY_OPERATOR", "ADMIN"]))):
    event = vehicle_service.resolve_sos(sos_id)
    if not event:
        raise HTTPException(404, "SOS event not found")
    return event
