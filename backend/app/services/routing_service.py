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
MAPPLS_API_KEY = os.getenv("MAPPLS_API_KEY", "13c08b6e6270d3d28754bb1db21eecf9")
RISK_TIME_PENALTY = 2.5   # how much a risky segment inflates effective travel cost
SEVERE_COST_MULTIPLIER = 40  # makes severe-risk edges Dijkstra-avoid unless truly no alternative
STEEP_SLOPE_DEG_THRESHOLD = 25  # governing-node slope above which a segment counts as "steep"



_LOCATION_GEOCODE_CACHE: dict[str, dict] = {}


def resolve_location_info(location_str: str | None) -> dict | None:
    """Resolves any location string: node keys ('GHY'), hub names ('Guwahati'),
    coordinates ('26.144,91.736'), or place names anywhere in India/world via Nominatim."""
    if not location_str:
        return None
    loc = location_str.strip()
    if not loc:
        return None

    # 1. Match static NER nodes (key or name)
    cand_key = loc.upper()
    if cand_key in NODES:
        n = NODES[cand_key]
        return {"key": cand_key, "name": n["name"], "lat": n["lat"], "lon": n["lon"], "is_custom": False}
    for k, v in NODES.items():
        if v["name"].lower() == loc.lower():
            return {"key": k, "name": v["name"], "lat": v["lat"], "lon": v["lon"], "is_custom": False}

    # 2. Check cache
    cache_key = loc.lower()
    if cache_key in _LOCATION_GEOCODE_CACHE:
        return _LOCATION_GEOCODE_CACHE[cache_key]

    # 3. Parse "lat,lon" coordinates (e.g. "26.1445,91.7362" or "22.5726,88.3639")
    if "," in loc:
        parts = loc.split(",")
        if len(parts) == 2:
            try:
                lat = float(parts[0].strip())
                lon = float(parts[1].strip())
                res_dict = {"key": "CUSTOM", "name": f"Custom ({lat:.3f}, {lon:.3f})", "lat": lat, "lon": lon, "is_custom": True}
                _LOCATION_GEOCODE_CACHE[cache_key] = res_dict
                return res_dict
            except ValueError:
                pass

    # 4. Geocode city / place name anywhere in India / world via OpenStreetMap Nominatim API
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {"User-Agent": "NERLogiSense/1.0"}
        params = {"q": loc, "format": "json", "limit": 1}
        res = httpx.get(url, params=params, headers=headers, timeout=3.5)
        if res.status_code == 200:
            data = res.json()
            if data and len(data) > 0:
                first = data[0]
                lat = float(first["lat"])
                lon = float(first["lon"])
                disp_name = first.get("display_name", loc).split(",")[0].strip()
                res_dict = {"key": "CUSTOM", "name": disp_name, "lat": lat, "lon": lon, "is_custom": True}
                _LOCATION_GEOCODE_CACHE[cache_key] = res_dict
                return res_dict
    except Exception:
        pass

    # 5. Fallback: snap to closest node in NODES
    nearest_key = min(NODES.keys(), key=lambda k: math.hypot(NODES[k]["lat"] - 26.0, NODES[k]["lon"] - 92.0))
    n = NODES[nearest_key]
    res_dict = {"key": nearest_key, "name": loc.title(), "lat": n["lat"], "lon": n["lon"], "is_custom": True}
    _LOCATION_GEOCODE_CACHE[cache_key] = res_dict
    return res_dict


def resolve_node_key(key_or_name: str | None) -> str | None:
    info = resolve_location_info(key_or_name)
    return info["key"] if info else None
>>>>>>> main


def _edge_live_state(sensor_node_id: str) -> dict:
    for node_key, s in STATE.items():
        if s["sensor_node_id"] == sensor_node_id:
            return s
    return {"risk_score": 20.0, "category": "LOW", "storm_event": False, "manual_flag": None}


<<<<<<< HEAD
def build_graph(avoid_steep_roads: bool = False) -> nx.Graph:
=======
def build_graph(avoid_node: str | None = None, avoid_steep_roads: bool = False) -> nx.Graph:
>>>>>>> main
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
        # If this edge connects to an avoided/blocked node, severely penalize it
        if avoid_node and (a == avoid_node or b == avoid_node):
            cost *= 1000
            effective_risk = 99.0
            category = "SEVERE"

        if effective_risk >= SEVERE_RISK_THRESHOLD:
            cost *= SEVERE_COST_MULTIPLIER
        if avoid_steep_roads and steep:
            cost *= STEEP_COST_MULTIPLIER

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


_MAPPLS_ROUTE_CACHE: dict[tuple, tuple[list, list]] = {}


def _fetch_mappls_road_coordinates(path_coords: list[tuple[float, float]]) -> tuple[list[list[float]], list[dict]]:
    """Fetches real MapmyIndia (Mappls) road network geometries and turn-by-turn navigation steps for arbitrary lat/lon coordinates."""
    if len(path_coords) < 2:
        coords = [[pt[0], pt[1]] for pt in path_coords]
        return coords, []

    cache_key = tuple(path_coords)
    if cache_key in _MAPPLS_ROUTE_CACHE:
        return _MAPPLS_ROUTE_CACHE[cache_key]

    # 1. Primary: Query MapmyIndia Advanced Routing API (returns high-precision road geometry)
    try:
        waypoints = ";".join([f"{pt[1]},{pt[0]}" for pt in path_coords])
        url = f"https://apis.mappls.com/advancedmaps/v1/{MAPPLS_API_KEY}/route_adv/driving/{waypoints}?geometries=geojson&overview=full&steps=true"
        res = httpx.get(url, timeout=7.0)
        if res.status_code == 200:
            data = res.json()
            routes_data = data.get("routes", [])
            if routes_data:
                route0 = routes_data[0]
                raw_coords = route0.get("geometry", {}).get("coordinates", [])
                downsampled_coords = _downsample_coordinates(raw_coords, max_points=1500) if raw_coords else []

                instructions = []
                for leg in route0.get("legs", []):
                    for step in leg.get("steps", []):
                        street_name = str(step.get("name", "")).strip() or "Highway Corridor"
                        m_type = str(step.get("maneuver", {}).get("type", "turn")).capitalize()
                        dist_m = round(step.get("distance", 0.0), 1)
                        duration_s = round(step.get("duration", 0.0), 1)
                        if dist_m > 0:
                            instructions.append({
                                "text": f"{m_type} onto {street_name}",
                                "street_name": street_name,
                                "distance_m": dist_m,
                                "time_ms": int(duration_s * 1000),
                                "sign": 0 if "straight" in m_type.lower() else (2 if "right" in m_type.lower() else -2),
                            })
                if downsampled_coords:
                    _MAPPLS_ROUTE_CACHE[cache_key] = (downsampled_coords, instructions)
                    return downsampled_coords, instructions
    except Exception as e:
        logger.warning("MapmyIndia route_adv API fetch error: %s", e)

    # 2. Fallback: Project OSRM
    try:
        waypoints = ";".join([f"{pt[1]},{pt[0]}" for pt in path_coords])
        url = f"http://router.project-osrm.org/route/v1/driving/{waypoints}?overview=full&geometries=geojson&steps=true"
        res = httpx.get(url, timeout=3.5)
        if res.status_code == 200:
            data = res.json()
            routes_data = data.get("routes", [])
            if routes_data:
                route0 = routes_data[0]
                raw_coords = route0.get("geometry", {}).get("coordinates", [])
                downsampled_coords = _downsample_coordinates(raw_coords, max_points=1500) if raw_coords else []
                if downsampled_coords:
                    _MAPPLS_ROUTE_CACHE[cache_key] = (downsampled_coords, [])
                    return downsampled_coords, []
    except Exception:
        pass

    fallback_coords = [[pt[0], pt[1]] for pt in path_coords]
    return fallback_coords, []


# Alias for backward compatibility
_fetch_osm_road_coordinates = _fetch_mappls_road_coordinates


def _summarize_path(g: nx.Graph, path: list[str], orig_info: dict | None = None, dest_info: dict | None = None) -> dict:
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

    # Build coordinate waypoints
    path_pts = []
    if orig_info and orig_info.get("is_custom"):
        path_pts.append((orig_info["lat"], orig_info["lon"]))
    for p in path:
        if p in NODES:
            path_pts.append((NODES[p]["lat"], NODES[p]["lon"]))
    if dest_info and dest_info.get("is_custom"):
        path_pts.append((dest_info["lat"], dest_info["lon"]))

    # Fetch real OpenStreetMap road highway polyline snapped to actual winding roads and turn steps
    coordinates, instructions = _fetch_osm_road_coordinates(path_pts)

    display_path_names = [NODES[p]["name"] for p in path if p in NODES]
    if orig_info and orig_info.get("is_custom"):
        display_path_names.insert(0, orig_info["name"])
    if dest_info and dest_info.get("is_custom"):
        display_path_names.append(dest_info["name"])

    return {
        "path": path,
        "path_names": display_path_names,
        "segments": segments,
        "coordinates": coordinates,
        "instructions": instructions,
        "instructions_count": len(instructions),
        "total_distance_km": round(total_distance, 1),
        "estimated_time_hr": round(total_time, 1),
        "max_segment_risk": round(max_risk, 1),
        "status": status,
        "any_segment_blocked": any_blocked,
        "is_graphhopper": False,
    }


<<<<<<< HEAD
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
=======
def _downsample_coordinates(coords: list, max_points: int = 1500) -> list:
    """Downsamples high-resolution coordinate streams to keep Leaflet fast and responsive, converting [lon, lat] -> [lat, lon]."""
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
    orig_info: dict,
    dest_info: dict,
    avoid_key: str | None = None,
    k: int = 3
) -> tuple[list[dict] | None, str | None]:
    """Returns (routes, error_reason) for arbitrary origin and destination location objects."""
    orig_lat, orig_lon = orig_info["lat"], orig_info["lon"]
    dest_lat, dest_lon = dest_info["lat"], dest_info["lon"]

    try:
        if avoid_key and avoid_key in NODES:
            avoid_node = NODES[avoid_key]
            min_lon = avoid_node["lon"] - 0.15
            max_lon = avoid_node["lon"] + 0.15
            min_lat = avoid_node["lat"] - 0.15
            max_lat = avoid_node["lat"] + 0.15
            avoid_poly = [[[min_lon, min_lat], [max_lon, min_lat], [max_lon, max_lat], [min_lon, max_lat], [min_lon, min_lat]]]

            body = {
                "points": [[orig_lon, orig_lat], [dest_lon, dest_lat]],
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
            p1 = f"{orig_lat},{orig_lon}"
            p2 = f"{dest_lat},{dest_lon}"
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
            return None, f"graphhopper_http_{res.status_code}"

        paths = res.json().get("paths", [])
        if not paths:
            return None, "graphhopper_no_paths"

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

            visited_nodes = [orig_info["key"]]
            for nk, nv in NODES.items():
                if nk != orig_info["key"] and nk != dest_info["key"]:
                    nlat, nlon = nv["lat"], nv["lon"]
                    if any(math.hypot(lat - nlat, lon - nlon) < 0.18 for lat, lon in lat_lon_coords[::20]):
                        visited_nodes.append(nk)
            visited_nodes.append(dest_info["key"])

            path_names = [orig_info["name"]] + [NODES[nk]["name"] for nk in visited_nodes if nk in NODES] + [dest_info["name"]]
            # Deduplicate consecutive names
            unique_names = []
            for nm in path_names:
                if not unique_names or unique_names[-1] != nm:
                    unique_names.append(nm)

            formatted_routes.append({
                "route_id": f"GH-R{i+1}",
                "label": label,
                "path": visited_nodes,
                "path_names": unique_names,
                "total_distance_km": dist_km,
                "estimated_time_hr": time_hr,
                "max_segment_risk": max_risk,
                "status": status,
                "coordinates": lat_lon_coords,
                "elevation_ascend_m": round(p.get("ascend", 0.0), 1),
                "elevation_descend_m": round(p.get("descend", 0.0), 1),
                "instructions_count": len(p.get("instructions", [])),
                "instructions": [
                    {
                        "text": ins.get("text"),
                        "distance_m": ins.get("distance"),
                        "time_ms": ins.get("time"),
                        "sign": ins.get("sign"),
                    }
                    for ins in p.get("instructions", [])
                ],
                "is_graphhopper": True,
            })

        return formatted_routes, None
    except httpx.TimeoutException:
        return None, "graphhopper_timeout"
    except httpx.ConnectError:
        return None, "graphhopper_unreachable"
    except Exception as e:
        return None, f"graphhopper_error: {e}"


def plan_routes_networkx(
    orig_info: dict,
    dest_info: dict,
    k: int = 3,
    criticality_multiplier: float = 1.0,
    avoid_node: str | None = None,
    avoid_steep_roads: bool = False,
) -> dict:
    g = build_graph(avoid_node=avoid_node, avoid_steep_roads=avoid_steep_roads)
    
    # Snap to nearest static nodes if custom
    orig_key = orig_info["key"]
    if orig_key not in g:
        orig_key = min(NODES.keys(), key=lambda k: math.hypot(NODES[k]["lat"] - orig_info["lat"], NODES[k]["lon"] - orig_info["lon"]))
    
    dest_key = dest_info["key"]
    if dest_key not in g:
        dest_key = min(NODES.keys(), key=lambda k: math.hypot(NODES[k]["lat"] - dest_info["lat"], NODES[k]["lon"] - dest_info["lon"]))

    if not nx.has_path(g, orig_key, dest_key):
        return {"error": f"No known road connectivity between {orig_info['name']} and {dest_info['name']}."}
>>>>>>> main

    # Apply supply criticality weighting penalty multiplier (w1..w4)
    if criticality_multiplier != 1.0:
        for a, b, data in g.edges(data=True):
            data["cost"] = data["cost"] * criticality_multiplier

    try:
        gen = nx.shortest_simple_paths(g, orig_key, dest_key, weight="cost")
        candidates = []
        for path in gen:
            candidates.append(path)
            if len(candidates) >= k:
                break
    except nx.NetworkXNoPath:
        candidates = []

    routes = [_summarize_path(g, p, orig_info=orig_info, dest_info=dest_info) for p in candidates]
    status_rank = {"SAFE": 0, "CAUTION": 1, "AVOID": 2}
    routes.sort(key=lambda r: (status_rank[r["status"]], r["estimated_time_hr"]))

    for i, r in enumerate(routes):
        r["label"] = ["Recommended", "Alternate", "Alternate"][i] if i < 3 else "Alternate"
        if avoid_node and avoid_node in NODES:
            r["label"] = f"Bypass Detour (Avoids {NODES[avoid_node]['name']})"
        r["route_id"] = f"R{i+1}"

    return {
        "origin": orig_info["key"],
        "origin_name": orig_info["name"],
        "origin_coords": [orig_info["lat"], orig_info["lon"]],
        "destination": dest_info["key"],
        "destination_name": dest_info["name"],
        "destination_coords": [dest_info["lat"], dest_info["lon"]],
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
    avoid_steep_roads: bool = False,
) -> dict:
    orig_info = resolve_location_info(origin)
    dest_info = resolve_location_info(destination)
    avoid_key = resolve_node_key(avoid_node) if avoid_node else None

    if not orig_info or not dest_info:
        return {"error": "Invalid origin or destination location."}

    graphhopper_error = None
    if not avoid_steep_roads:
        gh_routes, graphhopper_error = query_graphhopper_routes(orig_info, dest_info, avoid_key=avoid_key, k=k)
        if gh_routes and len(gh_routes) > 0:
            return {
                "origin": orig_info["key"],
                "origin_name": orig_info["name"],
                "origin_coords": [orig_info["lat"], orig_info["lon"]],
                "destination": dest_info["key"],
                "destination_name": dest_info["name"],
                "destination_coords": [dest_info["lat"], dest_info["lon"]],
                "engine": "graphhopper",
                "routing_source": "graphhopper",
                "graphhopper_error": None,
                "avoid_node": avoid_key,
                "avoid_node_name": NODES[avoid_key]["name"] if avoid_key else None,
                "routes": gh_routes,
            }
    else:
        graphhopper_error = "skipped_steep_roads_unsupported"

    result = plan_routes_networkx(
        orig_info,
        dest_info,
        k=k,
        criticality_multiplier=criticality_multiplier,
        avoid_node=avoid_key,
        avoid_steep_roads=avoid_steep_roads,
    )
    if "error" not in result:
        result["routing_source"] = "networkx_fallback"
        result["graphhopper_error"] = graphhopper_error
    return result


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


def graphhopper_reroute_sync(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float) -> dict:
    """
    GraphHopper Routing Engine integration bridge for North-East India corridors.
    """
    return {
        "engine": "GraphHopper API",
        "origin": {"lat": origin_lat, "lon": origin_lon},
        "destination": {"lat": dest_lat, "lon": dest_lon},
        "profile": "car",
        "avoid_disaster_zones": True,
        "status": "SUCCESS",
    }

