from fastapi import APIRouter, HTTPException

from app.graph_data import NODES
from app.services import routing_service

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("/nodes")
def list_nodes():
    return [{"key": k, **v} for k, v in NODES.items()]


@router.get("/graph")
def graph_snapshot():
    return routing_service.full_graph_snapshot()


@router.get("/plan")
def plan(origin: str, destination: str, k: int = 3, avoid_steep_roads: bool = False):
    origin = origin.upper()
    destination = destination.upper()
    result = routing_service.plan_routes(origin, destination, k=k, avoid_steep_roads=avoid_steep_roads)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result
