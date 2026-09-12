"""
Ground-truth reporting: field officials / drivers / travellers submit a
geo-tagged, optionally photographed incident report ("road blocked here",
"landslide already happened", "bridge damaged"). This is the human-in-the-
loop signal that manually overrides / confirms the AI prediction for the
nearest monitored node, which the routing engine then treats as at least as
risky as the manual report says (see manual_flag in simulation_service).
"""

import math
import time
from datetime import datetime, timezone

from app.graph_data import NODES
from app.services.simulation_service import STATE, ALERTS, broadcast
from app.services import notify_service

REPORTS: list[dict] = []

INCIDENT_RISK = {
    "landslide_occurred": 95,
    "road_blocked": 85,
    "bridge_damage": 80,
    "flooding": 75,
    "heavy_rain_warning": 55,
    "minor_obstruction": 40,
    "all_clear": 0,
}


def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _nearest_node(lat: float, lon: float) -> str:
    return min(NODES.keys(), key=lambda k: _haversine_km(lat, lon, NODES[k]["lat"], NODES[k]["lon"]))


async def submit_report(reporter_name: str, phone: str, incident_type: str, description: str,
                         lat: float, lon: float, photo_path: str | None,
                         captured_at: str | None = None) -> dict:
    node_key = _nearest_node(lat, lon)
    risk_score = INCIDENT_RISK.get(incident_type, 60)
    node_state = STATE[node_key]
    received_at = datetime.now(timezone.utc).isoformat()

    report = {
        "id": f"RPT-{int(time.time() * 1000)}",
        "reporter_name": reporter_name,
        "phone": phone,
        "incident_type": incident_type,
        "description": description,
        "lat": lat,
        "lon": lon,
        "nearest_node": node_key,
        "nearest_node_name": node_state["name"],
        "photo_path": photo_path,
        # Device-side capture time (when the field officer actually took the
        # photo/filed the report), distinct from created_at (when the server
        # received it) -- falls back to received time if the client omitted it.
        "captured_at": captured_at or received_at,
        "created_at": received_at,
    }
    REPORTS.insert(0, report)
    del REPORTS[500:]

    if incident_type == "all_clear":
        node_state["manual_flag"] = None
    elif risk_score > 0:
        node_state["manual_flag"] = {
            "risk_score": risk_score,
            "category": "SEVERE" if risk_score >= 70 else ("HIGH" if risk_score >= 50 else "MODERATE"),
            "reason": description or incident_type,
            "reported_by": reporter_name,
            "reported_at": report["created_at"],
        }

        alert = {
            "id": f"ALT-{report['id']}",
            "type": "GROUND_REPORT",
            "node_key": node_key,
            "node_name": node_state["name"],
            "district": node_state["district"],
            "risk_score": risk_score,
            "category": node_state["manual_flag"]["category"],
            "message": f"Ground report near {node_state['name']} ({node_state['district']}): "
                       f"{incident_type.replace('_', ' ')}. \"{description}\" -- reported by {reporter_name}.",
            "created_at": report["created_at"],
            "active": True,
        }
        ALERTS.insert(0, alert)
        broadcast({"kind": "alert", "data": alert})
        broadcast({"kind": "ground_report", "data": report})
        await notify_service.broadcast_route_danger(alert)

    return report
