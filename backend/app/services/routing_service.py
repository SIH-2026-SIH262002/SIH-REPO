"""
AI-assisted rerouting engine.

Builds a NetworkX graph from the static NER road topology (graph_data.py)
where every edge's live weight comes from the ML-predicted risk score of its
governing sensor node (simulation_service.STATE). Segments at/above the
SEVERE threshold are treated as effectively impassable (huge cost) so the
shortest-simple-paths search naturally routes around them -- this is the
"automatic rerouting" behaviour: if the direct segment is dangerous, the
engine surfaces the next-best alternate corridor instead, exactly like the
"A to Z via B, C or D" scenario described in the problem statement.
"""

import networkx as nx

from app.graph_data import NODES, EDGES
from app.services.simulation_service import STATE, HIGH_RISK_THRESHOLD, SEVERE_RISK_THRESHOLD

RISK_TIME_PENALTY = 2.5   # how much a risky segment inflates effective travel cost
SEVERE_COST_MULTIPLIER = 40  # makes severe-risk edges Dijkstra-avoid unless truly no alternative
STEEP_SLOPE_DEG_THRESHOLD = 25  # governing-node slope above which a segment counts as "steep"
STEEP_COST_MULTIPLIER = 6  # penalty applied to steep segments when avoid_steep_roads is set


def _edge_live_state(sensor_node_id: str) -> dict:
    for node_key, s in STATE.items():
        if s["sensor_node_id"] == sensor_node_id:
            return s
    return {"risk_score": 20.0, "category": "LOW", "storm_event": False, "manual_flag": None}


def build_graph(avoid_steep_roads: bool = False) -> nx.Graph:
    g = nx.Graph()
    for key, node in NODES.items():
        g.add_node(key, **node)

    for a, b, distance_km, base_time_hr, highway_ref, sensor_node_id in EDGES:
        live = _edge_live_state(sensor_node_id)
        risk_score = live["risk_score"]
        manual = live.get("manual_flag")
        effective_risk = max(risk_score, manual["risk_score"]) if manual else risk_score
        category = live["category"] if effective_risk == risk_score else manual["category"]
        slope_deg = live.get("slope_angle_deg", 0.0)
        steep = slope_deg >= STEEP_SLOPE_DEG_THRESHOLD

        cost = base_time_hr * (1 + (effective_risk / 100) * RISK_TIME_PENALTY)
        if effective_risk >= SEVERE_RISK_THRESHOLD:
            cost *= SEVERE_COST_MULTIPLIER
        if avoid_steep_roads and steep:
            cost *= STEEP_COST_MULTIPLIER

        g.add_edge(
            a, b,
            distance_km=distance_km,
            base_time_hr=base_time_hr,
            highway_ref=highway_ref,
            sensor_node_id=sensor_node_id,
            risk_score=round(effective_risk, 1),
            category=category,
            storm_event=bool(live.get("storm_event")),
            manually_flagged=manual is not None,
            flagged=effective_risk >= HIGH_RISK_THRESHOLD,
            blocked=effective_risk >= SEVERE_RISK_THRESHOLD,
            slope_deg=round(slope_deg, 1),
            steep=steep,
            cost=cost,
        )
    return g


def _summarize_path(g: nx.Graph, path: list[str]) -> dict:
    segments = []
    total_distance = 0.0
    total_time = 0.0
    max_risk = 0.0
    any_blocked = False
    for a, b in zip(path[:-1], path[1:]):
        e = g.edges[a, b]
        segments.append({
            "from": a, "from_name": NODES[a]["name"],
            "to": b, "to_name": NODES[b]["name"],
            "distance_km": e["distance_km"],
            "time_hr": e["base_time_hr"],
            "highway_ref": e["highway_ref"],
            "risk_score": e["risk_score"],
            "category": e["category"],
            "storm_event": e["storm_event"],
            "manually_flagged": e["manually_flagged"],
            "flagged": e["flagged"],
            "blocked": e["blocked"],
            "slope_deg": e["slope_deg"],
            "steep": e["steep"],
        })
        total_distance += e["distance_km"]
        total_time += e["base_time_hr"] * (1 + (e["risk_score"] / 100) * RISK_TIME_PENALTY * 0.5)
        max_risk = max(max_risk, e["risk_score"])
        any_blocked = any_blocked or e["blocked"]

    if any_blocked:
        status = "AVOID"
    elif max_risk >= HIGH_RISK_THRESHOLD:
        status = "CAUTION"
    else:
        status = "SAFE"

    return {
        "path": path,
        "path_names": [NODES[p]["name"] for p in path],
        "segments": segments,
        "total_distance_km": round(total_distance, 1),
        "estimated_time_hr": round(total_time, 1),
        "max_segment_risk": round(max_risk, 1),
        "status": status,
        "any_segment_blocked": any_blocked,
    }


def plan_routes(
    origin: str,
    destination: str,
    k: int = 3,
    criticality_multiplier: float = 1.0,
    avoid_steep_roads: bool = False,
) -> dict:
    g = build_graph(avoid_steep_roads=avoid_steep_roads)
    if origin not in g or destination not in g:
        return {"error": f"Unknown node(s). Valid nodes: {sorted(NODES.keys())}"}
    if not nx.has_path(g, origin, destination):
        return {"error": f"No known road connectivity between {origin} and {destination} in this demo graph."}

    # Apply supply criticality weighting penalty multiplier (w1..w4)
    if criticality_multiplier != 1.0:
        for a, b, data in g.edges(data=True):
            data["cost"] = data["cost"] * criticality_multiplier

    try:
        gen = nx.shortest_simple_paths(g, origin, destination, weight="cost")
        candidates = []
        for path in gen:
            candidates.append(path)
            if len(candidates) >= k:
                break
    except nx.NetworkXNoPath:
        candidates = []

    routes = [_summarize_path(g, p) for p in candidates]
    # de-dupe by identical node sequence (safety) and sort: SAFE < CAUTION < AVOID, then time
    status_rank = {"SAFE": 0, "CAUTION": 1, "AVOID": 2}
    routes.sort(key=lambda r: (status_rank[r["status"]], r["estimated_time_hr"]))

    for i, r in enumerate(routes):
        r["label"] = ["Recommended", "Alternate", "Alternate"][i] if i < 3 else "Alternate"
        r["route_id"] = f"R{i+1}"

    return {
        "origin": origin,
        "origin_name": NODES[origin]["name"],
        "destination": destination,
        "destination_name": NODES[destination]["name"],
        "routes": routes,
    }


def full_graph_snapshot() -> dict:
    g = build_graph()
    nodes = []
    for key in g.nodes:
        s = STATE.get(key, {})
        nodes.append({
            **NODES[key],
            "node_key": key,
            "risk_score": s.get("risk_score", 0),
            "category": s.get("category", "LOW"),
            "storm_event": s.get("storm_event", False),
        })
    edges = []
    for a, b, data in g.edges(data=True):
        edges.append({"from": a, "to": b, **data})
    return {"nodes": nodes, "edges": edges}
