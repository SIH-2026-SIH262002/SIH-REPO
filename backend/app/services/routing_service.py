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

import os
import math
import httpx
import networkx as nx

from app.graph_data import NODES, EDGES
from app.services.simulation_service import STATE, HIGH_RISK_THRESHOLD, SEVERE_RISK_THRESHOLD

GRAPHHOPPER_URL = os.getenv("GRAPHHOPPER_URL", "http://localhost:8989")
RISK_TIME_PENALTY = 2.5   # how much a risky segment inflates effective travel cost
SEVERE_COST_MULTIPLIER = 40  # makes severe-risk edges Dijkstra-avoid unless truly no alternative


def resolve_node_key(key_or_name: str | None) -> str | None:
    if not key_or_name:
        return None
    cand = key_or_name.upper().strip()
    if cand in NODES:
        return cand
    for k, v in NODES.items():
        if v["name"].lower() == key_or_name.lower().strip():
            return k
    return None


def _edge_live_state(sensor_node_id: str) -> dict:
    for node_key, s in STATE.items():
        if s["sensor_node_id"] == sensor_node_id:
            return s
    return {"risk_score": 20.0, "category": "LOW", "storm_event": False, "manual_flag": None}


def build_graph(avoid_node: str | None = None) -> nx.Graph:
    g = nx.Graph()
    for key, node in NODES.items():
        g.add_node(key, **node)

    for a, b, distance_km, base_time_hr, highway_ref, sensor_node_id in EDGES:
        live = _edge_live_state(sensor_node_id)
        risk_score = live["risk_score"]
        manual = live.get("manual_flag")
        effective_risk = max(risk_score, manual["risk_score"]) if manual else risk_score
        category = live["category"] if effective_risk == risk_score else manual["category"]

        cost = base_time_hr * (1 + (effective_risk / 100) * RISK_TIME_PENALTY)
        # If this edge connects to an avoided/blocked node, severely penalize it
        if avoid_node and (a == avoid_node or b == avoid_node):
            cost *= 1000
            effective_risk = 99.0
            category = "SEVERE"

        if effective_risk >= SEVERE_RISK_THRESHOLD:
            cost *= SEVERE_COST_MULTIPLIER

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

    # Convert path node sequence into geographic coordinates for map polyline rendering
    coordinates = [[NODES[p]["lat"], NODES[p]["lon"]] for p in path]

    return {
        "path": path,
        "path_names": [NODES[p]["name"] for p in path],
        "segments": segments,
        "coordinates": coordinates,
        "total_distance_km": round(total_distance, 1),
        "estimated_time_hr": round(total_time, 1),
        "max_segment_risk": round(max_risk, 1),
        "status": status,
        "any_segment_blocked": any_blocked,
        "is_graphhopper": False,
    }


def _downsample_coordinates(coords: list, max_points: int = 750) -> list:
    """Downsamples high-resolution OSM coordinate streams to keep Leaflet fast and responsive."""
    if len(coords) <= max_points:
        return [[c[1], c[0]] for c in coords]  # convert [lon, lat] -> [lat, lon]
    step = len(coords) / (max_points - 1)
    indices = [int(i * step) for i in range(max_points - 1)]
    if (len(coords) - 1) not in indices:
        indices.append(len(coords) - 1)
    return [[coords[idx][1], coords[idx][0]] for idx in indices]


def _calculate_route_risk(coords: list) -> tuple[float, str]:
    """Calculates route risk by finding proximity to active sensor stations."""
    max_risk = 0.0
    for node_key, s in STATE.items():
        n_info = NODES.get(node_key)
        if not n_info:
            continue
        n_lat, n_lon = n_info["lat"], n_info["lon"]
        # Check if route passes within ~0.35 degrees (~38km) of this sensor station
        for lat, lon in coords[::25]:  # sample every 25th point
            d = math.hypot(lat - n_lat, lon - n_lon)
            if d < 0.35:
                max_risk = max(max_risk, s.get("risk_score", 0.0))
                break

    if max_risk >= SEVERE_RISK_THRESHOLD:
        status = "AVOID"
    elif max_risk >= HIGH_RISK_THRESHOLD:
        status = "CAUTION"
    else:
        status = "SAFE"
    return round(max_risk, 1), status


def query_graphhopper_routes(
    orig_key: str,
    dest_key: str,
    avoid_key: str | None = None,
    k: int = 3
) -> list[dict] | None:
    orig = NODES.get(orig_key)
    dest = NODES.get(dest_key)
    if not orig or not dest:
        return None

    try:
        if avoid_key and avoid_key in NODES:
            avoid_node = NODES[avoid_key]
            min_lon = avoid_node["lon"] - 0.15
            max_lon = avoid_node["lon"] + 0.15
            min_lat = avoid_node["lat"] - 0.15
            max_lat = avoid_node["lat"] + 0.15
            avoid_poly = [[[min_lon, min_lat], [max_lon, min_lat], [max_lon, max_lat], [min_lon, max_lat], [min_lon, min_lat]]]

            body = {
                "points": [[orig["lon"], orig["lat"]], [dest["lon"], dest["lat"]]],
                "profile": "car",
                "points_encoded": False,
                "ch.disable": True,
                "custom_model": {
                    "areas": {
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "id": "avoid_hazard_zone",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": avoid_poly
                            }
                        }]
                    },
                    "priority": [{"if": "in_avoid_hazard_zone", "multiply_by": 0.0}]
                }
            }
            res = httpx.post(f"{GRAPHHOPPER_URL}/route", json=body, timeout=4.0)
        else:
            p1 = f"{orig['lat']},{orig['lon']}"
            p2 = f"{dest['lat']},{dest['lon']}"
            params = [
                ("point", p1),
                ("point", p2),
                ("profile", "car"),
                ("algorithm", "alternative_route"),
                ("alternative_route.max_paths", str(k)),
                ("alternative_route.max_weight_factor", "1.6"),
                ("alternative_route.max_share_factor", "0.7"),
                ("points_encoded", "false")
            ]
            res = httpx.get(f"{GRAPHHOPPER_URL}/route", params=params, timeout=4.0)

        if res.status_code != 200:
            return None

        paths = res.json().get("paths", [])
        if not paths:
            return None

        formatted_routes = []
        labels = ["Recommended", "Alternate Bypass 1", "Alternate Highland Bypass 2"]

        for i, p in enumerate(paths):
            raw_coords = p.get("points", {}).get("coordinates", [])
            lat_lon_coords = _downsample_coordinates(raw_coords)
            dist_km = round(p.get("distance", 0.0) / 1000.0, 1)
            time_hr = round(p.get("time", 0.0) / 3600000.0, 1)
            max_risk, status = _calculate_route_risk(lat_lon_coords)

            label = labels[i] if i < len(labels) else f"Alternate Route {i+1}"
            if avoid_key:
                label = f"Detour Bypass (Avoids {NODES[avoid_key]['name']})"

            # Determine visited nodes along route for simulation compatibility
            visited_nodes = [orig_key]
            for nk, nv in NODES.items():
                if nk != orig_key and nk != dest_key:
                    nlat, nlon = nv["lat"], nv["lon"]
                    if any(math.hypot(lat - nlat, lon - nlon) < 0.18 for lat, lon in lat_lon_coords[::20]):
                        visited_nodes.append(nk)
            visited_nodes.append(dest_key)

            formatted_routes.append({
                "route_id": f"GH-R{i+1}",
                "label": label,
                "path": visited_nodes,
                "path_names": [NODES[p]["name"] for p in visited_nodes],
                "total_distance_km": dist_km,
                "estimated_time_hr": time_hr,
                "max_segment_risk": max_risk,
                "status": status,
                "coordinates": lat_lon_coords,
                "elevation_ascend_m": round(p.get("ascend", 0.0), 1),
                "elevation_descend_m": round(p.get("descend", 0.0), 1),
                "instructions_count": len(p.get("instructions", [])),
                "is_graphhopper": True,
            })

        return formatted_routes
    except Exception:
        return None


def plan_routes_networkx(
    origin: str,
    destination: str,
    k: int = 3,
    criticality_multiplier: float = 1.0,
    avoid_node: str | None = None,
) -> dict:
    g = build_graph(avoid_node=avoid_node)
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
    status_rank = {"SAFE": 0, "CAUTION": 1, "AVOID": 2}
    routes.sort(key=lambda r: (status_rank[r["status"]], r["estimated_time_hr"]))

    for i, r in enumerate(routes):
        r["label"] = ["Recommended", "Alternate", "Alternate"][i] if i < 3 else "Alternate"
        if avoid_node and avoid_node in NODES:
            r["label"] = f"Bypass Detour (Avoids {NODES[avoid_node]['name']})"
        r["route_id"] = f"R{i+1}"

    return {
        "origin": origin,
        "origin_name": NODES[origin]["name"],
        "origin_coords": [NODES[origin]["lat"], NODES[origin]["lon"]],
        "destination": destination,
        "destination_name": NODES[destination]["name"],
        "destination_coords": [NODES[destination]["lat"], NODES[destination]["lon"]],
        "engine": "networkx",
        "avoid_node": avoid_node,
        "avoid_node_name": NODES[avoid_node]["name"] if avoid_node and avoid_node in NODES else None,
        "routes": routes,
    }


def plan_routes(
    origin: str,
    destination: str,
    k: int = 3,
    criticality_multiplier: float = 1.0,
    avoid_node: str | None = None,
) -> dict:
    orig_key = resolve_node_key(origin)
    dest_key = resolve_node_key(destination)
    avoid_key = resolve_node_key(avoid_node) if avoid_node else None

    if not orig_key or not dest_key:
        return {"error": f"Unknown node(s). Valid nodes: {sorted(NODES.keys())}"}

    # Try live GraphHopper first
    gh_routes = query_graphhopper_routes(orig_key, dest_key, avoid_key=avoid_key, k=k)
    if gh_routes and len(gh_routes) > 0:
        return {
            "origin": orig_key,
            "origin_name": NODES[orig_key]["name"],
            "origin_coords": [NODES[orig_key]["lat"], NODES[orig_key]["lon"]],
            "destination": dest_key,
            "destination_name": NODES[dest_key]["name"],
            "destination_coords": [NODES[dest_key]["lat"], NODES[dest_key]["lon"]],
            "engine": "graphhopper",
            "avoid_node": avoid_key,
            "avoid_node_name": NODES[avoid_key]["name"] if avoid_key else None,
            "routes": gh_routes,
        }

    # Fallback to NetworkX
    return plan_routes_networkx(
        orig_key,
        dest_key,
        k=k,
        criticality_multiplier=criticality_multiplier,
        avoid_node=avoid_key,
    )


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
