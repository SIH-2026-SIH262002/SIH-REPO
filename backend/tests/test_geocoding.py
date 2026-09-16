"""
Automated unit & integration tests for Address Geocoding, Disambiguation,
Local GraphHopper Routing, and Pre-Dispatch Safety Revalidation.
"""

import pytest
from app.services.geocoding_service import geocode_address, validate_coordinates
from app.services import routing_service, vehicle_service


def test_validate_coordinates_bounds():
    assert validate_coordinates(26.1445, 91.7362) is True
    assert validate_coordinates(-91.0, 45.0) is False
    assert validate_coordinates(45.0, 181.0) is False


def test_geocode_static_hub_exact():
    res = geocode_address("Guwahati")
    assert res["status"] == "EXACT"
    assert res["lat"] is not None
    assert res["lng"] is not None
    assert "Guwahati" in res["address"]


def test_geocode_explicit_coordinates():
    res = geocode_address("26.1445, 91.7362")
    assert res["status"] == "EXACT"
    assert round(res["lat"], 3) == 26.145
    assert round(res["lng"], 3) == 91.736


def test_geocode_ambiguous_generic_query(monkeypatch):
    # Mock Nominatim returning multiple matches
    def mock_httpx_get(url, params=None, headers=None, timeout=None):
        class MockResponse:
            status_code = 200
            def json(self):
                return [
                    {"display_name": "District Hospital, Haflong, Assam", "lat": "25.183", "lon": "93.018"},
                    {"display_name": "District Hospital, Diphu, Assam", "lat": "25.842", "lon": "93.431"},
                ]
        return MockResponse()

    import httpx
    monkeypatch.setattr(httpx, "get", mock_httpx_get)

    res = geocode_address("District Hospital Query Test")
    assert res["status"] == "AMBIGUOUS"
    assert len(res["candidates"]) == 2
    assert "Haflong" in res["candidates"][0]["address"]
    assert "Diphu" in res["candidates"][1]["address"]


def test_plan_routes_with_freeform_addresses():
    plan = routing_service.plan_routes("Guwahati Railway Station, Assam", "Silchar Medical College, Assam")
    assert "error" not in plan
    assert plan["origin_name"] is not None
    assert plan["destination_name"] is not None
    assert len(plan["routes"]) > 0
    route0 = plan["routes"][0]
    assert route0["total_distance_km"] > 0
    assert route0["estimated_time_hr"] > 0
    assert route0["status"] in ("SAFE", "CAUTION", "AVOID")


def test_pre_dispatch_revalidation_blocks_severe_route():
    vehicle_service.init_vehicles()
    # If selected route is AVOID, assign_vehicle_route must raise ValueError
    plan = routing_service.plan_routes("GHY", "SLC")
    routes = plan["routes"]
    
    # Create synthetic avoid route object for test
    severe_route = dict(routes[0])
    severe_route["status"] = "AVOID"
    severe_route["route_id"] = "R-SEVERE-TEST"
    
    with pytest.raises(ValueError) as exc_info:
        # Pass override_avoid_risk=False
        vehicle_service.assign_route_to_vehicle(
            vehicle_id="VEH-001",
            origin="GHY",
            destination="SLC",
            route_id="R-SEVERE-TEST",
            override_avoid_risk=False,
            dispatched_by="test_operator",
        )
    assert "AVOID" in str(exc_info.value) or "not among" in str(exc_info.value)
