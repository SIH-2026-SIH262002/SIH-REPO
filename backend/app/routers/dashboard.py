from fastapi import APIRouter, Depends

from app.services.simulation_service import STATE, ALERTS
from app.services.vehicle_service import VEHICLES, SOS_EVENTS
from app.services import routing_service
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(user: dict = Depends(get_current_user)):
    nodes = list(STATE.values())
    by_category = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "SEVERE": 0}
    for n in nodes:
        by_category[n["category"]] = by_category.get(n["category"], 0) + 1

    graph = routing_service.full_graph_snapshot()
    flagged_edges = [e for e in graph["edges"] if e["flagged"]]
    blocked_edges = [e for e in graph["edges"] if e["blocked"]]

    vehicles = list(VEHICLES.values())
    vehicle_status = {}
    for v in vehicles:
        vehicle_status[v["status"]] = vehicle_status.get(v["status"], 0) + 1

    district_status = [
        {
            "district": n["district"],
            "state": n["state"],
            "node_name": n["name"],
            "risk_score": n["risk_score"],
            "category": n["category"],
            "storm_event": n["storm_event"],
            "manually_flagged": n.get("manual_flag") is not None,
        }
        for n in sorted(nodes, key=lambda x: -x["risk_score"])
    ]

    return {
        "nodes_by_category": by_category,
        "total_nodes": len(nodes),
        "flagged_corridors": len(flagged_edges),
        "blocked_corridors": len(blocked_edges),
        "active_alerts": len([a for a in ALERTS if a.get("active")]),
        "total_alerts_logged": len(ALERTS),
        "open_sos": len([s for s in SOS_EVENTS if s["status"] == "OPEN"]),
        "vehicles_total": len(vehicles),
        "vehicles_by_status": vehicle_status,
        "district_status": district_status,
        "recent_alerts": ALERTS[:10],
    }
