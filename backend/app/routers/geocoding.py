"""
Router for address resolution and geocoding endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.services.geocoding_service import geocode_address
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/routes", tags=["geocoding"])


class GeocodeRequest(BaseModel):
    address: str = Field(..., description="Address query string, e.g. 'Guwahati Railway Station, Assam'")


class LocationCandidate(BaseModel):
    address: str
    lat: float
    lng: float


class GeocodeResponse(BaseModel):
    status: str
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    node_key: str | None = None
    query: str | None = None
    candidates: list[LocationCandidate] = []


@router.post("/geocode", response_model=GeocodeResponse)
def geocode_address_endpoint(req: GeocodeRequest, current_user: dict = Depends(get_current_user)):
    """
    Resolves an input address string to latitude and longitude coordinates.
    Returns EXACT coordinates or AMBIGUOUS candidates if multiple location matches exist.
    """
    if not req.address or not req.address.strip():
        raise HTTPException(status_code=400, detail="Address query string cannot be empty.")
    
    result = geocode_address(req.address)
    if result.get("status") == "INVALID":
        raise HTTPException(status_code=400, detail=result.get("error", "Invalid address query."))
    
    return result
