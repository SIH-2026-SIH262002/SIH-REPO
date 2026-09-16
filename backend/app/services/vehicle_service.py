"""
Simulates GPS-tracked logistics vehicles moving along the road network so the
dashboard has something live to show for "real-time movement and delivery
status of essential supplies". Positions are linearly interpolated between
the node coordinates of each vehicle's currently-planned (risk-aware) route.

This module also holds the vehicle's "active route" -- the real dispatch
target for the Logistics Operator workflow. `assign_route_to_vehicle()` lets
an operator select a genuinely computed route (GraphHopper or the NetworkX
risk-aware fallback, never fabricated) and dispatch it to a vehicle; the
per-tick `_reevaluate_vehicle_route()` re-checks that active route against
live sensor/ground-report risk and only replans when a segment still ahead
of the vehicle has actually become blocked, respecting REROUTE_COOLDOWN_SECONDS
so a route can't flicker between two options tick after tick.
"""

import logging
import random
import time
from datetime import datetime, timezone

from app.graph_data import NODES, EDGES
from app.services import routing_service
from app.services.simulation_service import broadcast

logger = logging.getLogger("ner.vehicle_service")

CARGO_TYPES = ["Medicines", "Food Supplies", "Construction Materials", "Agricultural Produce", "Fuel"]
DRIVER_NAMES = ["R. Sangma", "T. Lyngdoh", "P. Deka", "K. Marak", "L. Zeliang", "M. Chakma", "A. Konyak"]

VEHICLES: dict[str, dict] = {}
SOS_EVENTS: list[dict] = []

REROUTE_COOLDOWN_SECONDS = 15
STATUS_RANK = {"SAFE": 0, "CAUTION": 1, "AVOID": 2}

_node_pairs = None


def _all_node_pairs():
    global _node_pairs
    if _node_pairs is None:
        keys = list(NODES.keys())
        _node_pairs = [(a, b) for a in keys for b in keys if a != b]
    return _node_pairs


def _assign_new_trip(vehicle: dict):
    origin, destination = random.choice(_all_node_pairs())
    plan = routing_service.plan_routes(origin, destination, k=1)
    if "error" in plan or not plan.get("routes"):
        vehicle["route_nodes"] = [origin, destination]
        vehicle["active_route_id"] = None
        vehicle["active_route_status"] = "SAFE"
        vehicle["active_route_engine"] = "networkx"
        pts = [(NODES[origin]["lat"], NODES[origin]["lon"]), (NODES[destination]["lat"], NODES[destination]["lon"])]
        road_coords, _ = routing_service._fetch_mappls_road_coordinates(pts)
        vehicle["active_route_coordinates"] = road_coords or [[NODES[origin]["lat"], NODES[origin]["lon"]], [NODES[destination]["lat"], NODES[destination]["lon"]]]
    else:
        route = plan["routes"][0]
        vehicle["route_nodes"] = route["path"]
        vehicle["active_route_id"] = route.get("route_id")
        vehicle["active_route_status"] = route.get("status", "SAFE")
        vehicle["active_route_engine"] = plan.get("engine", "networkx")
        vehicle["active_route_coordinates"] = route.get("coordinates")
    vehicle["origin"] = origin
    vehicle["destination"] = destination
    vehicle["origin_name"] = NODES[origin]["name"]
    vehicle["destination_name"] = NODES[destination]["name"]
    vehicle["segment_index"] = 0
    vehicle["segment_progress"] = 0.0
    vehicle["status"] = "MOVING"
    vehicle["lat"] = NODES[origin]["lat"]
    vehicle["lon"] = NODES[origin]["lon"]
    vehicle["avoid_steep_roads"] = False
    vehicle["dispatched_by"] = None
    vehicle["last_reroute_at"] = time.time()


def init_vehicles(n: int = 6):
    for i in range(n):
        vid = f"VEH-{i+1:03d}"
        vehicle = {
            "id": vid,
            "driver_name": random.choice(DRIVER_NAMES),
            "phone": f"+9199999{random.randint(10000, 99999)}",
            "cargo_type": CARGO_TYPES[i % len(CARGO_TYPES)],
            "speed_kmph": random.randint(30, 55),
        }
        _assign_new_trip(vehicle)
        VEHICLES[vid] = vehicle


def _lerp(a, b, t):
    return a + (b - a) * t


def _interpolate_along_coords(coords: list[list[float]], progress: float) -> tuple[float, float]:
    if not coords:
        return 26.15, 92.93
    if len(coords) == 1:
        return coords[0][0], coords[0][1]
    p = max(0.0, min(1.0, progress))
    target_idx = p * (len(coords) - 1)
    i = min(len(coords) - 2, int(target_idx))
    t = target_idx - i
    lat = coords[i][0] + (coords[i + 1][0] - coords[i][0]) * t
    lon = coords[i][1] + (coords[i + 1][1] - coords[i][1]) * t
    return round(lat, 5), round(lon, 5)


def enrich_vehicle(v: dict) -> dict:
    if not v:
        return v
    path = v.get("route_nodes") or []
    idx = v.get("segment_index", 0)
    progress = v.get("segment_progress", 0.0)
    speed = max(20, v.get("speed_kmph", 40))

    # Calculate remaining distance across route
    rem_dist = 0.0
    if len(path) >= 2 and idx < len(path) - 1:
        # Remaining in current segment
        a_key, b_key = path[idx], path[idx + 1]
        seg = next((e for e in EDGES if {e[0], e[1]} == {a_key, b_key}), None)
        seg_len = seg[2] if seg else 80.0
        rem_dist += max(0.0, (1.0 - progress) * seg_len)

        # Subsequent segments
        for i in range(idx + 1, len(path) - 1):
            s_a, s_b = path[i], path[i + 1]
            s_edge = next((e for e in EDGES if {e[0], e[1]} == {s_a, s_b}), None)
            rem_dist += s_edge[2] if s_edge else 80.0

    v["remaining_distance_km"] = round(rem_dist, 1)
    eta_mins = int(round((rem_dist / speed) * 60))
    v["eta_minutes"] = eta_mins
    hrs = eta_mins // 60
    mins = eta_mins % 60
    v["eta_formatted"] = f"{hrs}h {mins:02d}m" if hrs > 0 else f"{mins} mins"

    # Human-readable corridor and path
    v["route_path_names"] = [NODES.get(k, {}).get("name", k) for k in path]
    v["route_label"] = " → ".join(v["route_path_names"]) if v["route_path_names"] else f"{v.get('origin_name')} → {v.get('destination_name')}"

    # Ensure real MapmyIndia road-snapped curvature coordinates for map polyline rendering
    current_coords = v.get("active_route_coordinates")
    if not current_coords or len(current_coords) <= len(path):
        path_pts = [(NODES[k]["lat"], NODES[k]["lon"]) for k in path if k in NODES]
        if len(path_pts) >= 2:
            road_coords, _ = routing_service._fetch_mappls_road_coordinates(path_pts)
            if road_coords and len(road_coords) > len(path):
                v["active_route_coordinates"] = road_coords
            else:
                v["active_route_coordinates"] = [[pt[0], pt[1]] for pt in path_pts]

    return v


def _resolve_vehicle(vehicle_id: str) -> dict | None:
    v = VEHICLES.get(vehicle_id)
    if v:
        return v
    for candidate in VEHICLES.values():
        if candidate.get("code") == vehicle_id:
            return candidate
    return None


def assign_route_to_vehicle(
    vehicle_id: str,
    origin: str,
    destination: str,
    avoid_node: str | None = None,
    avoid_steep_roads: bool = False,
    criticality_multiplier: float = 1.0,
    route_id: str | None = None,
    dispatched_by: str | None = None,
    override_avoid_risk: bool = False,
) -> dict:
    """Operator-triggered real dispatch. Always recomputes the plan server-side
    (via routing_service.plan_routes -- real GraphHopper or NetworkX fallback,
    never trusting client-supplied geometry/risk) and only then assigns it to
    the vehicle. Raises ValueError on any invalid/unsafe request; the caller
    is expected to translate that into an HTTP 4xx -- this function never
    silently no-ops or reports success without actually assigning a route."""
    vehicle = _resolve_vehicle(vehicle_id)
    if vehicle is None:
        raise KeyError(f"Vehicle '{vehicle_id}' not found.")

    plan = routing_service.plan_routes(
        origin,
        destination,
        k=3,
        criticality_multiplier=criticality_multiplier,
        avoid_node=avoid_node,
        avoid_steep_roads=avoid_steep_roads,
    )
    if "error" in plan:
        raise ValueError(plan["error"])

    routes = plan.get("routes", [])
    if not routes:
        raise ValueError("No viable route found between the requested origin and destination.")

    chosen = None
    if route_id:
        chosen = next((r for r in routes if r.get("route_id") == route_id), None)
        if chosen is None:
            raise ValueError(
                f"Route '{route_id}' is not among the currently computed candidates "
                f"-- risk conditions may have changed. Re-plan and re-select."
            )
    else:
        chosen = routes[0]

    if chosen["status"] == "AVOID" and not override_avoid_risk:
        raise ValueError(
            f"Selected route '{chosen.get('route_id')}' is classified AVOID (severe risk) "
            f"and cannot be dispatched without an explicit emergency override."
        )

    orig_key = plan["origin"]
    dest_key = plan["destination"]

    vehicle["route_nodes"] = chosen["path"]
    vehicle["origin"] = orig_key
    vehicle["destination"] = dest_key
    vehicle["origin_name"] = plan["origin_name"]
    vehicle["destination_name"] = plan["destination_name"]
    vehicle["segment_index"] = 0
    vehicle["segment_progress"] = 0.0
    vehicle["status"] = "MOVING"
    vehicle["lat"] = plan["origin_coords"][0]
    vehicle["lon"] = plan["origin_coords"][1]
    vehicle["avoid_steep_roads"] = avoid_steep_roads
    vehicle["active_route_id"] = chosen.get("route_id")
    vehicle["active_route_status"] = chosen.get("status")
    vehicle["active_route_engine"] = plan.get("engine")
    vehicle["active_route_coordinates"] = chosen.get("coordinates")
    vehicle["dispatched_by"] = dispatched_by
    vehicle["last_reroute_at"] = time.time()

    logger.info(
        "ROUTE_DISPATCHED vehicle=%s route=%s status=%s engine=%s dispatched_by=%s origin=%s destination=%s",
        vehicle["id"], chosen.get("route_id"), chosen.get("status"), plan.get("engine"),
        dispatched_by, orig_key, dest_key,
    )

    broadcast({
        "kind": "route_dispatched",
        "data": {
            "vehicle_id": vehicle["id"],
            "vehicle_code": vehicle.get("code"),
            "route_id": chosen.get("route_id"),
            "status": chosen.get("status"),
            "engine": plan.get("engine"),
            "routing_source": plan.get("routing_source"),
            "origin": orig_key,
            "destination": dest_key,
            "dispatched_by": dispatched_by,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    })

    return {"plan": plan, "selected_route": chosen}


def _remaining_path_status(g, path: list[str]) -> tuple[str, float, str | None]:
    """Returns (status, max_risk, first_blocked_segment_label) for the edges
    still ahead on `path`, using the graph's CURRENT live risk weights."""
    max_risk = 0.0
    any_blocked = False
    blocked_label = None
    for a, b in zip(path[:-1], path[1:]):
        if a not in g or b not in g or not g.has_edge(a, b):
            continue
        e = g.edges[a, b]
        max_risk = max(max_risk, e["risk_score"])
        if e["blocked"] and not any_blocked:
            any_blocked = True
            blocked_label = f"{NODES[a]['name']} -> {NODES[b]['name']}"
    if any_blocked:
        return "AVOID", max_risk, blocked_label
    high_risk_threshold = getattr(routing_service, "HIGH_RISK_THRESHOLD", 50)
    if max_risk >= high_risk_threshold:
        return "CAUTION", max_risk, None
    return "SAFE", max_risk, None


def _reevaluate_vehicle_route(vehicle: dict):
    if vehicle["status"] not in ("MOVING",):
        return
    path = vehicle.get("route_nodes") or []
    idx = vehicle.get("segment_index", 0)
    if len(path) < 2 or idx >= len(path) - 1:
        return

    now = time.time()
    if now - vehicle.get("last_reroute_at", 0) < REROUTE_COOLDOWN_SECONDS:
        return

    remaining = path[idx:]
    g = routing_service.build_graph(avoid_steep_roads=vehicle.get("avoid_steep_roads", False))
    current_status, current_risk, blocked_label = _remaining_path_status(g, remaining)

    if current_status != "AVOID":
        return  # only reroute on a materially worse (blocked) active route -- no flicker

    current_node = remaining[0]
    destination = path[-1]
    if current_node == destination:
        return

    try:
        plan = routing_service.plan_routes(
            current_node,
            destination,
            k=3,
            avoid_steep_roads=vehicle.get("avoid_steep_roads", False),
        )
    except Exception:
        logger.exception("Auto-reroute planning failed for vehicle=%s", vehicle["id"])
        return

    if "error" in plan or not plan.get("routes"):
        return

    best = plan["routes"][0]
    if STATUS_RANK.get(best["status"], 2) >= STATUS_RANK[current_status]:
        return  # nothing better available -- stay on current path rather than thrash

    previous_route_id = vehicle.get("active_route_id")
    previous_status = vehicle.get("active_route_status")
    previous_path_names = [NODES[n]["name"] for n in remaining if n in NODES]

    vehicle["route_nodes"] = path[:idx] + best["path"]
    vehicle["segment_progress"] = 0.0
    vehicle["active_route_id"] = best.get("route_id")
    vehicle["active_route_status"] = best.get("status")
    vehicle["active_route_engine"] = plan.get("engine")
    vehicle["active_route_coordinates"] = best.get("coordinates")
    vehicle["last_reroute_at"] = now

    reason = f"Hazard detected on active corridor near {blocked_label}" if blocked_label else "Active route risk increased"

    new_path_names = best.get("path_names") or [NODES[n]["name"] for n in best["path"] if n in NODES]

    logger.info(
        "ROUTE_REROUTED vehicle=%s previous_path=%s previous_status=%s new_path=%s new_status=%s "
        "reason=%s risk_before=%s risk_after=%s engine=%s",
        vehicle["id"], " -> ".join(previous_path_names), previous_status,
        " -> ".join(new_path_names), best.get("status"),
        reason, current_risk, best.get("max_segment_risk"), plan.get("engine"),
    )

    broadcast({
        "kind": "route_rerouted",
        "data": {
            "vehicle_id": vehicle["id"],
            "vehicle_code": vehicle.get("code"),
            # route_id is a positional label re-assigned on every fresh plan_routes()
            # call, not a stable identity across replans -- the path (node sequence /
            # names) is what actually identifies "which route" before vs after.
            "previous_route": previous_route_id,
            "previous_status": previous_status,
            "previous_path": remaining,
            "previous_path_names": previous_path_names,
            "new_recommended_route": best.get("route_id"),
            "new_status": best.get("status"),
            "new_path": best["path"],
            "new_path_names": new_path_names,
            "reason": reason,
            "risk_before": current_risk,
            "risk_after": best.get("max_segment_risk"),
            "engine": plan.get("engine"),
            "routing_source": plan.get("routing_source", plan.get("engine")),
            "alternatives": [r.get("route_id") for r in plan["routes"] if r is not best],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    })


def tick_vehicles(dt_hours: float):
    for v in VEHICLES.values():
        if v["status"] in ("SOS", "BREAKDOWN"):
            continue

        try:
            _reevaluate_vehicle_route(v)
        except Exception:
            logger.exception("Route re-evaluation crashed for vehicle=%s", v.get("id"))

        path = v["route_nodes"]
        if len(path) < 2:
            _assign_new_trip(v)
            continue

        idx = v["segment_index"]
        if idx >= len(path) - 1:
            _assign_new_trip(v)
            continue

        a_key, b_key = path[idx], path[idx + 1]
        a, b = NODES[a_key], NODES[b_key]
        seg = next((e for e in EDGES if {e[0], e[1]} == {a_key, b_key}), None)
        distance_km = seg[2] if seg else 100

        distance_covered = v["speed_kmph"] * dt_hours
        progress_delta = distance_covered / max(1, distance_km)
        v["segment_progress"] += progress_delta

        if v["segment_progress"] >= 1.0:
            v["segment_index"] += 1
            v["segment_progress"] = 0.0
            if v["segment_index"] >= len(path) - 1:
                v["status"] = "DELIVERED"
                dest_coords = v.get("active_route_coordinates")
                if dest_coords and len(dest_coords) > 0:
                    v["lat"], v["lon"] = dest_coords[-1][0], dest_coords[-1][1]
                else:
                    v["lat"], v["lon"] = b["lat"], b["lon"]
                broadcast({"kind": "vehicle_update", "data": enrich_vehicle(v)})
                continue
            a_key, b_key = path[v["segment_index"]], path[v["segment_index"] + 1]
            a, b = NODES[a_key], NODES[b_key]

        coords = v.get("active_route_coordinates")
        if coords and len(coords) >= 2:
            overall_progress = (v["segment_index"] + min(0.999, v["segment_progress"])) / max(1, len(path) - 1)
            v["lat"], v["lon"] = _interpolate_along_coords(coords, overall_progress)
        else:
            v["lat"] = round(_lerp(a["lat"], b["lat"], min(1.0, v["segment_progress"])), 5)
            v["lon"] = round(_lerp(a["lon"], b["lon"], min(1.0, v["segment_progress"])), 5)
        v["current_segment"] = f"{a_key}-{b_key}"
        broadcast({"kind": "vehicle_update", "data": enrich_vehicle(v)})


def trigger_sos(vehicle_id: str | None, driver_name: str, phone: str, lat: float, lon: float,
                 issue_type: str, message: str) -> dict:
    event = {
        "id": f"SOS-{int(time.time() * 1000)}",
        "vehicle_id": vehicle_id,
        "driver_name": driver_name,
        "phone": phone,
        "lat": lat,
        "lon": lon,
        "issue_type": issue_type,
        "message": message,
        "status": "OPEN",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    SOS_EVENTS.insert(0, event)
    if vehicle_id and vehicle_id in VEHICLES:
        VEHICLES[vehicle_id]["status"] = "SOS"
    broadcast({"kind": "sos", "data": event})
    return event


def resolve_sos(sos_id: str) -> dict | None:
    for e in SOS_EVENTS:
        if e["id"] == sos_id:
            e["status"] = "RESOLVED"
            if e["vehicle_id"] and e["vehicle_id"] in VEHICLES:
                VEHICLES[e["vehicle_id"]]["status"] = "MOVING"
            broadcast({"kind": "sos_resolved", "data": e})
            return e
    return None
