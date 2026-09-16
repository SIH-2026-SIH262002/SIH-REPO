"""
Routing / dispatch / live-reroute tests for backend/app.

Covers:
  * GraphHopper success is parsed for real (distance/duration/geometry/status),
    never fabricated, and marked routing_source == "graphhopper".
  * GraphHopper failure (unreachable) falls back to the NetworkX risk-aware
    engine and is marked routing_source == "networkx_fallback" with a
    graphhopper_error explaining why -- never silently claimed as GraphHopper.
  * Existing severe-risk (40x) and steep-road (6x) multipliers are unaffected
    by this work.
  * POST /api/vehicles/{id}/assign-route: role-gated (LOGISTICS_OPERATOR/ADMIN
    only), re-validates the route server-side, rejects AVOID routes without
    override, rejects an unknown route_id, and actually persists the
    assignment (readable back via GET .../active-route).
  * The live auto-reroute check only switches a vehicle off its active route
    when a segment still ahead has genuinely become blocked, and leaves an
    already-blocked-free route alone (no flicker).

Run from backend/:  python -m pytest tests/test_routing.py -q
"""
import time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import routing_service, vehicle_service
from app.services.simulation_service import STATE

_ctx = TestClient(app)
client = _ctx.__enter__()


def teardown_module(module):
    _ctx.__exit__(None, None, None)


LOGISTICS_CREDS = {"identifier": "logistics@nerlogisense.gov.in", "password": "password123"}
ADMIN_CREDS = {"identifier": "admin@nerlogisense.gov.in", "password": "password123"}
OFFICER_CREDS = {"identifier": "officer@nerlogisense.gov.in", "password": "password123"}


def _login(creds: dict) -> str:
    res = client.post("/api/auth/login", json=creds)
    assert res.status_code == 200, res.text
    return res.json()["accessToken"]


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


LOGISTICS_TOKEN = None
ADMIN_TOKEN = None


def setup_module(module):
    global LOGISTICS_TOKEN, ADMIN_TOKEN
    LOGISTICS_TOKEN = _login(LOGISTICS_CREDS)
    ADMIN_TOKEN = _login(ADMIN_CREDS)


# ---------------------------------------------------------------------------
# GraphHopper real-call / real-fallback semantics
# ---------------------------------------------------------------------------

def test_graphhopper_unreachable_falls_back_to_networkx_and_is_labeled_honestly(monkeypatch):
    def _fail(*args, **kwargs):
        return None, "graphhopper_unreachable"

    monkeypatch.setattr(routing_service, "query_graphhopper_routes", _fail)
    result = routing_service.plan_routes("GHY", "SLC", k=3)

    assert "error" not in result
    assert result["engine"] == "networkx"
    assert result["routing_source"] == "networkx_fallback"
    assert result["graphhopper_error"] == "graphhopper_unreachable"
    assert len(result["routes"]) >= 1
    # Never claim GraphHopper was used when it wasn't.
    assert all(r["is_graphhopper"] is False for r in result["routes"])


def test_graphhopper_success_is_parsed_for_real_and_labeled_correctly(monkeypatch):
    fake_gh_routes = [{
        "route_id": "GH-R1",
        "label": "Recommended",
        "path": ["GHY", "SLC"],
        "path_names": ["Guwahati", "Silchar"],
        "total_distance_km": 218.4,
        "estimated_time_hr": 5.5,
        "max_segment_risk": 12.0,
        "status": "SAFE",
        "coordinates": [[26.14, 91.73], [24.83, 92.77]],
        "elevation_ascend_m": 120.0,
        "elevation_descend_m": 80.0,
        "instructions_count": 4,
        "instructions": [{"text": "Head south on NH-27", "distance_m": 1000, "time_ms": 60000, "sign": 0}],
        "is_graphhopper": True,
    }]

    def _succeed(*args, **kwargs):
        return fake_gh_routes, None

    monkeypatch.setattr(routing_service, "query_graphhopper_routes", _succeed)
    result = routing_service.plan_routes("GHY", "SLC", k=3)

    assert result["engine"] == "graphhopper"
    assert result["routing_source"] == "graphhopper"
    assert result["graphhopper_error"] is None
    assert result["routes"][0]["is_graphhopper"] is True
    assert result["routes"][0]["instructions"][0]["text"] == "Head south on NH-27"


def test_avoid_steep_roads_skips_graphhopper_and_uses_networkx(monkeypatch):
    called = {"gh": False}

    def _spy(*args, **kwargs):
        called["gh"] = True
        return None, "should_not_be_called"

    monkeypatch.setattr(routing_service, "query_graphhopper_routes", _spy)
    result = routing_service.plan_routes("GHY", "SLC", k=3, avoid_steep_roads=True)

    assert called["gh"] is False
    assert result["engine"] == "networkx"
    assert result["graphhopper_error"] == "skipped_steep_roads_unsupported"


# ---------------------------------------------------------------------------
# Severe-risk (40x) and steep-road (6x) multipliers preserved
# ---------------------------------------------------------------------------

def test_severe_risk_and_steep_multipliers_preserved(monkeypatch):
    def _live_state(sensor_node_id):
        if sensor_node_id == "SEVERE_NODE":
            return {"risk_score": 90.0, "category": "SEVERE", "storm_event": False, "manual_flag": None, "slope_angle_deg": 5.0}
        if sensor_node_id == "STEEP_NODE":
            return {"risk_score": 10.0, "category": "LOW", "storm_event": False, "manual_flag": None, "slope_angle_deg": 30.0}
        if sensor_node_id == "BOTH_NODE":
            return {"risk_score": 90.0, "category": "SEVERE", "storm_event": False, "manual_flag": None, "slope_angle_deg": 30.0}
        return {"risk_score": 10.0, "category": "LOW", "storm_event": False, "manual_flag": None, "slope_angle_deg": 5.0}

    monkeypatch.setattr(routing_service, "_edge_live_state", _live_state)
    monkeypatch.setattr(routing_service, "EDGES", [
        ("A", "B", 100.0, 2.0, "TEST-1", "SEVERE_NODE"),
        ("A", "C", 100.0, 2.0, "TEST-2", "STEEP_NODE"),
        ("A", "D", 100.0, 2.0, "TEST-3", "BOTH_NODE"),
        ("A", "E", 100.0, 2.0, "TEST-4", "PLAIN_NODE"),
    ])
    monkeypatch.setitem(routing_service.NODES, "A", {"name": "A", "lat": 0, "lon": 0})
    monkeypatch.setitem(routing_service.NODES, "B", {"name": "B", "lat": 0, "lon": 0})
    monkeypatch.setitem(routing_service.NODES, "C", {"name": "C", "lat": 0, "lon": 0})
    monkeypatch.setitem(routing_service.NODES, "D", {"name": "D", "lat": 0, "lon": 0})
    monkeypatch.setitem(routing_service.NODES, "E", {"name": "E", "lat": 0, "lon": 0})

    g_flag = routing_service.build_graph(avoid_steep_roads=True)
    g_noflag = routing_service.build_graph(avoid_steep_roads=False)

    plain_cost = g_noflag.edges["A", "E"]["cost"]
    severe_cost = g_noflag.edges["A", "B"]["cost"]
    steep_cost_flagged = g_flag.edges["A", "C"]["cost"]
    steep_cost_unflagged = g_noflag.edges["A", "C"]["cost"]
    both_cost_flagged = g_flag.edges["A", "D"]["cost"]
    severe_cost_with_flag = g_flag.edges["A", "B"]["cost"]

    base_time_hr = 2.0
    penalty = routing_service.RISK_TIME_PENALTY

    def pre_multiplier_cost(risk_score: float) -> float:
        return base_time_hr * (1 + (risk_score / 100) * penalty)

    plain_expected = pre_multiplier_cost(10.0)
    severe_pre = pre_multiplier_cost(90.0)
    steep_pre = pre_multiplier_cost(10.0)
    both_pre = pre_multiplier_cost(90.0)

    assert plain_cost == pytest.approx(plain_expected, rel=1e-6)

    # Severe multiplier (40x) applied on top of the risk-driven cost, and
    # completely unaffected by whether avoid_steep_roads is set.
    assert severe_cost == pytest.approx(severe_pre * routing_service.SEVERE_COST_MULTIPLIER, rel=1e-6)
    assert severe_cost_with_flag == pytest.approx(severe_cost, rel=1e-6)

    # Steep multiplier (6x) only applies when the flag is set.
    assert steep_cost_unflagged == pytest.approx(steep_pre, rel=1e-6)
    assert steep_cost_flagged == pytest.approx(steep_pre * routing_service.STEEP_COST_MULTIPLIER, rel=1e-6)

    # Stacking: severe (40x) * steep (6x) when both apply and flag is set.
    assert both_cost_flagged == pytest.approx(
        both_pre * routing_service.SEVERE_COST_MULTIPLIER * routing_service.STEEP_COST_MULTIPLIER, rel=1e-6
    )


# ---------------------------------------------------------------------------
# Real dispatch endpoint
# ---------------------------------------------------------------------------

def _get_vehicle_id():
    res = client.get("/api/vehicles", headers=_auth_header(LOGISTICS_TOKEN))
    assert res.status_code == 200
    vehicles = res.json()
    assert len(vehicles) > 0
    return vehicles[0]["id"]


def test_assign_route_rejects_unauthorized_role():
    field_token = _login(OFFICER_CREDS)
    vid = _get_vehicle_id()
    res = client.post(
        f"/api/vehicles/{vid}/assign-route",
        json={"origin": "GHY", "destination": "SLC"},
        headers=_auth_header(field_token),
    )
    assert res.status_code == 403


def test_assign_route_dispatches_a_real_route_and_is_readable_back():
    vid = _get_vehicle_id()
    res = client.post(
        f"/api/vehicles/{vid}/assign-route",
        json={"origin": "GHY", "destination": "SLC", "avoid_steep_roads": False},
        headers=_auth_header(LOGISTICS_TOKEN),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "DISPATCHED"
    assert body["route"]["path"][0] == "GHY"
    assert body["route"]["path"][-1] == "SLC"

    active = client.get(f"/api/vehicles/{vid}/active-route", headers=_auth_header(LOGISTICS_TOKEN))
    assert active.status_code == 200
    active_body = active.json()
    assert active_body["origin"] == "GHY"
    assert active_body["destination"] == "SLC"
    assert active_body["route_id"] == body["route"]["route_id"]


def test_assign_route_rejects_unknown_route_id():
    vid = _get_vehicle_id()
    res = client.post(
        f"/api/vehicles/{vid}/assign-route",
        json={"origin": "GHY", "destination": "SLC", "route_id": "NOT-A-REAL-ROUTE-ID"},
        headers=_auth_header(LOGISTICS_TOKEN),
    )
    assert res.status_code == 422
    assert "not among the currently computed candidates" in res.json()["detail"]


def test_assign_route_rejects_avoid_route_without_override(monkeypatch):
    def _fake_plan(*args, **kwargs):
        return {
            "origin": "GHY", "origin_name": "Guwahati", "origin_coords": [26.1, 91.7],
            "destination": "SLC", "destination_name": "Silchar", "destination_coords": [24.8, 92.7],
            "engine": "networkx", "routing_source": "networkx_fallback", "graphhopper_error": None,
            "avoid_node": None, "avoid_node_name": None,
            "routes": [{
                "route_id": "R1", "path": ["GHY", "SLC"], "path_names": ["Guwahati", "Silchar"],
                "status": "AVOID", "total_distance_km": 300, "estimated_time_hr": 8, "max_segment_risk": 95,
            }],
        }

    monkeypatch.setattr(routing_service, "plan_routes", _fake_plan)
    vid = _get_vehicle_id()
    res = client.post(
        f"/api/vehicles/{vid}/assign-route",
        json={"origin": "GHY", "destination": "SLC"},
        headers=_auth_header(LOGISTICS_TOKEN),
    )
    assert res.status_code == 422
    assert "AVOID" in res.json()["detail"]


def test_assign_route_unknown_vehicle_returns_404():
    res = client.post(
        "/api/vehicles/NOT-A-VEHICLE/assign-route",
        json={"origin": "GHY", "destination": "SLC"},
        headers=_auth_header(LOGISTICS_TOKEN),
    )
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Live auto-reroute: only switches when a segment ahead is genuinely blocked
# ---------------------------------------------------------------------------

def test_reevaluate_vehicle_route_leaves_safe_route_untouched():
    vehicle = {
        "id": "TEST-VEH", "status": "MOVING", "route_nodes": ["GHY", "SLC"],
        "segment_index": 0, "segment_progress": 0.1, "last_reroute_at": 0.0,
        "avoid_steep_roads": False, "active_route_id": "R1", "active_route_status": "SAFE",
    }
    before = dict(vehicle)
    vehicle_service._reevaluate_vehicle_route(vehicle)
    assert vehicle["route_nodes"] == before["route_nodes"]
    assert vehicle["active_route_id"] == before["active_route_id"]


def test_reevaluate_vehicle_route_switches_when_segment_becomes_blocked(monkeypatch):
    import networkx as nx

    def _blocked_graph(avoid_node=None, avoid_steep_roads=False):
        g = nx.Graph()
        g.add_node("GHY", name="Guwahati", lat=26.1, lon=91.7)
        g.add_node("SLC", name="Silchar", lat=24.8, lon=92.7)
        g.add_edge("GHY", "SLC", risk_score=95.0, blocked=True)
        return g

    def _better_plan(origin, destination, k=3, avoid_steep_roads=False, **kwargs):
        return {
            "engine": "networkx", "routing_source": "networkx_fallback",
            "routes": [{
                "route_id": "R-ALT", "path": [origin, destination], "path_names": [origin, destination],
                "status": "SAFE", "max_segment_risk": 10.0, "total_distance_km": 250, "estimated_time_hr": 6,
            }],
        }

    monkeypatch.setattr(routing_service, "build_graph", _blocked_graph)
    monkeypatch.setattr(routing_service, "plan_routes", _better_plan)

    vehicle = {
        "id": "TEST-VEH-2", "status": "MOVING", "route_nodes": ["GHY", "SLC"],
        "segment_index": 0, "segment_progress": 0.1, "last_reroute_at": 0.0,
        "avoid_steep_roads": False, "active_route_id": "R1", "active_route_status": "SAFE",
    }
    vehicle_service._reevaluate_vehicle_route(vehicle)

    assert vehicle["active_route_id"] == "R-ALT"
    assert vehicle["active_route_status"] == "SAFE"
    assert vehicle["route_nodes"] == ["GHY", "SLC"]


def test_reevaluate_vehicle_route_respects_cooldown(monkeypatch):
    import networkx as nx

    def _blocked_graph(avoid_node=None, avoid_steep_roads=False):
        g = nx.Graph()
        g.add_node("GHY", name="Guwahati", lat=26.1, lon=91.7)
        g.add_node("SLC", name="Silchar", lat=24.8, lon=92.7)
        g.add_edge("GHY", "SLC", risk_score=95.0, blocked=True)
        return g

    calls = {"count": 0}

    def _better_plan(*args, **kwargs):
        calls["count"] += 1
        return {"engine": "networkx", "routes": [{"route_id": "R-ALT", "path": ["GHY", "SLC"], "status": "SAFE", "max_segment_risk": 10.0}]}

    monkeypatch.setattr(routing_service, "build_graph", _blocked_graph)
    monkeypatch.setattr(routing_service, "plan_routes", _better_plan)

    vehicle = {
        "id": "TEST-VEH-3", "status": "MOVING", "route_nodes": ["GHY", "SLC"],
        "segment_index": 0, "segment_progress": 0.1, "last_reroute_at": time.time(),
        "avoid_steep_roads": False, "active_route_id": "R1", "active_route_status": "SAFE",
    }
    vehicle_service._reevaluate_vehicle_route(vehicle)
    assert calls["count"] == 0  # cooldown still active -- must not replan
    assert vehicle["active_route_id"] == "R1"
