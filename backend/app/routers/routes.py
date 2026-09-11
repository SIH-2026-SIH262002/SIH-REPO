from fastapi import APIRouter, HTTPException, Depends

from app.graph_data import NODES
from app.services import routing_service
from app.auth import get_current_user

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("/nodes")
def list_nodes(user: dict = Depends(get_current_user)):
    return [{"key": k, **v} for k, v in NODES.items()]


@router.get("/graph")
def graph_snapshot(user: dict = Depends(get_current_user)):
    return routing_service.full_graph_snapshot()


@router.get("/plan")
def plan(origin: str, destination: str, k: int = 3, user: dict = Depends(get_current_user)):
    origin = origin.upper()
    destination = destination.upper()
    result = routing_service.plan_routes(origin, destination, k=k)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result

