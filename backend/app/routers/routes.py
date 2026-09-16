from fastapi import APIRouter, HTTPException, Depends

from app.graph_data import NODES
from app.services import routing_service
from app.auth import get_current_user

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("/nodes")
def list_nodes(user: dict = Depends(get_current_user)):
    return [{"key": k, **v} for k, v in NODES.items()]


from typing import Optional
from pydantic import BaseModel

@router.get("/graph")
def graph_snapshot(user: dict = Depends(get_current_user)):
    return routing_service.full_graph_snapshot()


@router.get("/plan")
def plan(
    origin: str,
    destination: str,
    k: int = 3,
    criticality_multiplier: float = 1.0,
    avoid_node: Optional[str] = None,
    avoid_steep_roads: bool = False,
    user: dict = Depends(get_current_user),
):
    result = routing_service.plan_routes(
        origin=origin,
        destination=destination,
        k=k,
        criticality_multiplier=criticality_multiplier,
        avoid_node=avoid_node,
        avoid_steep_roads=avoid_steep_roads,
    )
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


class ReroutePayload(BaseModel):
    origin: str
    destination: str
    avoid_node: Optional[str] = None
    criticality_multiplier: float = 1.0
    k: int = 3


@router.post("/reroute")
def reroute(
    payload: ReroutePayload,
    user: dict = Depends(get_current_user),
):
    result = routing_service.plan_routes(
        origin=payload.origin,
        destination=payload.destination,
        k=payload.k,
        criticality_multiplier=payload.criticality_multiplier,
        avoid_node=payload.avoid_node,
    )
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


