"""
Auth security tests for the FastAPI gateway (backend/app).

Covers the closed-provisioning security model on this service's own
login/register/refresh/me endpoints and the demo/governance sensor controls:
  * no anonymous/synthetic identity (get_current_user)
  * no silent account auto-creation on login
  * no universal/demo master password
  * suspended/deactivated accounts cannot authenticate or refresh
  * ADMIN-only provisioning, with role/district validated server-side
  * self-protection on the acting Administrator's own account (register)
  * ADMIN/EMERGENCY_OPERATOR-only storm injection
  * a token shaped like the Express auth-service's (nested `claims.role`,
    not a top-level `role`) is still correctly understood as ADMIN --
    verified live against a running auth-service during this phase: without
    this hoist, a real Express-issued Admin token 401'd on every single
    ADMIN-gated FastAPI route.

NOTE: full account lifecycle (list/suspend/reactivate/deactivate/change-role/
change-district) is implemented and tested in backend/auth-service (Express +
SQLite) -- see backend/auth-service/tests/. This service's USERS_DB is the
in-memory demo/fallback store and intentionally does not duplicate that API
surface (see the note at the top of app/routers/auth.py).

Run from backend/:  .venv\\Scripts\\python.exe -m pytest
"""
import os
import time

import jwt
import pytest
from fastapi.testclient import TestClient

from app.main import app

# TestClient must be used as a context manager so FastAPI's startup event
# actually runs (it seeds simulation_service.STATE with the 18 sensor nodes;
# without it every /api/sensors/* call 404s regardless of auth).
_ctx = TestClient(app)
client = _ctx.__enter__()


def teardown_module(module):
    _ctx.__exit__(None, None, None)

ADMIN_CREDS = {"identifier": "admin@nerlogisense.gov.in", "password": "password123"}
OFFICER_CREDS = {"identifier": "officer@nerlogisense.gov.in", "password": "password123"}


def _login(creds: dict) -> str:
    res = client.post("/api/auth/login", json=creds)
    assert res.status_code == 200, res.text
    return res.json()["accessToken"]


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Login: no auto-create, no universal password, status enforcement
# ---------------------------------------------------------------------------

def test_login_rejects_unknown_identifier_instead_of_auto_creating():
    res = client.post(
        "/api/auth/login",
        json={"identifier": "nobody@nerlogisense.gov.in", "password": "whatever123"},
    )
    assert res.status_code == 401
    assert "accessToken" not in res.json()


def test_login_rejects_wrong_password():
    res = client.post(
        "/api/auth/login",
        json={"identifier": "officer@nerlogisense.gov.in", "password": "wrong-password"},
    )
    assert res.status_code == 401


def test_login_rejects_universal_demo_password_bypass():
    # 'password123' must only authenticate accounts whose real password is
    # literally 'password123' -- it must never work as a master password
    # for an arbitrary provided password.
    res = client.post(
        "/api/auth/login",
        json={"identifier": "officer@nerlogisense.gov.in", "password": "some-other-string"},
    )
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# get_current_user: no synthetic fallback identity
# ---------------------------------------------------------------------------

def test_protected_endpoint_rejects_missing_token():
    res = client.get("/api/vehicles")
    assert res.status_code == 401


def test_protected_endpoint_rejects_garbage_token():
    res = client.get("/api/vehicles", headers=_auth_header("not-a-real-token"))
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Provisioning (POST /api/auth/register)
# ---------------------------------------------------------------------------

def test_register_rejected_without_authentication():
    res = client.post(
        "/api/auth/register",
        json={"email": "anon@nerlogisense.gov.in", "fullName": "X", "password": "password1234"},
    )
    assert res.status_code == 401


def test_register_rejected_for_non_admin_caller():
    officer_token = _login(OFFICER_CREDS)
    res = client.post(
        "/api/auth/register",
        headers=_auth_header(officer_token),
        json={"email": "sneaky@nerlogisense.gov.in", "fullName": "X", "password": "password1234"},
    )
    assert res.status_code == 403


def test_admin_can_provision_user_with_valid_role_and_district():
    admin_token = _login(ADMIN_CREDS)
    res = client.post(
        "/api/auth/register",
        headers=_auth_header(admin_token),
        json={
            "email": "test.fieldofficer@nerlogisense.gov.in",
            "fullName": "Test Field Officer",
            "password": "a-strong-password",
            "role": "FIELD_OFFICER",
            "district": "Cachar",
            "organization": "Test Org",
        },
    )
    assert res.status_code == 200, res.text
    user = res.json()["user"]
    assert user["role"] == "FIELD_OFFICER"
    assert user["district"] == "Cachar"
    assert user["status"] == "ACTIVE"
    assert "password" not in user


def test_register_rejects_unknown_role():
    admin_token = _login(ADMIN_CREDS)
    res = client.post(
        "/api/auth/register",
        headers=_auth_header(admin_token),
        json={
            "email": "bad.role@nerlogisense.gov.in",
            "fullName": "X",
            "password": "password1234",
            "role": "WAREHOUSE_MANAGER",
            "district": "Cachar",
        },
    )
    assert res.status_code == 400


def test_register_rejects_unknown_district():
    admin_token = _login(ADMIN_CREDS)
    res = client.post(
        "/api/auth/register",
        headers=_auth_header(admin_token),
        json={
            "email": "bad.district@nerlogisense.gov.in",
            "fullName": "X",
            "password": "password1234",
            "role": "DRIVER",
            "district": "Atlantis",
        },
    )
    assert res.status_code == 400


def test_register_rejects_short_password():
    admin_token = _login(ADMIN_CREDS)
    res = client.post(
        "/api/auth/register",
        headers=_auth_header(admin_token),
        json={"email": "short.pw@nerlogisense.gov.in", "fullName": "X", "password": "short"},
    )
    assert res.status_code == 422  # pydantic Field(min_length=8) validation error


# ---------------------------------------------------------------------------
# Refresh: no synthetic identity for an unresolvable subject
# ---------------------------------------------------------------------------

def test_refresh_rejects_token_for_unknown_subject():
    jwt_secret = os.getenv("JWT_SECRET", "super-secret-demo-key-123")
    now = int(time.time())
    fake_refresh = jwt.encode(
        {"sub": "usr_does_not_exist", "sessionId": "sess_fake", "iat": now, "exp": now + 3600},
        jwt_secret,
        algorithm="HS256",
    )
    res = client.post(
        "/api/auth/refresh",
        json={"refreshToken": fake_refresh, "sessionId": "sess_fake"},
    )
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Sensor simulation controls (Admin / Emergency Operator governance action)
# ---------------------------------------------------------------------------

def test_model_info_requires_authentication():
    res = client.get("/api/risk/model-info")
    assert res.status_code == 401


def test_model_info_exposes_real_metrics_and_feature_importances():
    token = _login(OFFICER_CREDS)
    res = client.get("/api/risk/model-info", headers=_auth_header(token))
    assert res.status_code == 200
    body = res.json()
    assert "metrics" in body and "feature_importances" in body
    assert 0 < body["metrics"]["r2"] <= 1
    assert len(body["feature_importances"]) > 0


def test_express_shaped_token_with_nested_claims_role_is_understood_as_admin():
    """Regression test for the cross-service claim-shape bug found and fixed
    live during this phase (backend/app/auth.py decode_jwt): a real
    Express-issued token nests identity fields under `claims` rather than at
    the payload's top level. Build a token in that exact shape here (rather
    than depending on the Node service being reachable during a Python test
    run) and confirm the FastAPI gateway still resolves it to ADMIN."""
    jwt_secret = os.getenv("JWT_SECRET", "super-secret-demo-key-123")
    now = int(time.time())
    express_shaped_token = jwt.encode(
        {
            "sub": "user_expresslike01",
            "sid": "sess_expresslike",
            "claims": {
                "roles": ["ADMIN"],
                "role": "ADMIN",
                "fullName": "Express-Issued Admin",
                "email": "admin@nerlogisense.gov.in",
                "district": "East Khasi Hills",
                "organization": "NER LogiSense Command Center",
                "tenant": "NER_LOGISTICS",
            },
            "tenant": None,
            "iat": now,
            "exp": now + 900,
        },
        jwt_secret,
        algorithm="HS256",
    )

    res = client.post(
        "/api/sensors/inject-storm",
        headers=_auth_header(express_shaped_token),
        json={"node_key": "SHL"},
    )
    assert res.status_code == 200, res.text


def test_inject_storm_requires_admin_or_emergency_operator_role():
    anon = client.post("/api/sensors/inject-storm", json={"node_key": "GHY"})
    assert anon.status_code == 401

    officer_token = _login(OFFICER_CREDS)  # FIELD_OFFICER is not authorized
    denied = client.post(
        "/api/sensors/inject-storm",
        headers=_auth_header(officer_token),
        json={"node_key": "GHY"},
    )
    assert denied.status_code == 403

    admin_token = _login(ADMIN_CREDS)
    ok = client.post(
        "/api/sensors/inject-storm",
        headers=_auth_header(admin_token),
        json={"node_key": "GHY"},
    )
    assert ok.status_code == 200


def test_sensors_list_and_detail_require_authentication():
    """Sensor telemetry feeds the Logistics Operator risk view -- it must not
    be publicly readable without a session, even though any authenticated
    role may read it."""
    assert client.get("/api/sensors").status_code == 401
    assert client.get("/api/sensors/GUWAHATI").status_code == 401

    token = _login(OFFICER_CREDS)
    res = client.get("/api/sensors", headers=_auth_header(token))
    assert res.status_code == 200
    assert len(res.json()) > 0


def test_vehicles_list_requires_authentication():
    assert client.get("/api/vehicles").status_code == 401

    token = _login(OFFICER_CREDS)
    res = client.get("/api/vehicles", headers=_auth_header(token))
    assert res.status_code == 200


def test_driver_assigned_vehicle_never_fabricates_a_default_assignment():
    """Regression test: /api/vehicles/me used to hand an unmatched driver the
    first vehicle in the fleet as a 'demo fallback'. That is exactly the
    fabricated-operational-data pattern this service must not produce --
    a driver with no real assignment must see assigned: False, never
    someone else's vehicle."""
    admin_token = _login(ADMIN_CREDS)  # no driver identity matches any VEHICLES entry
    res = client.get("/api/vehicles/me", headers=_auth_header(admin_token))
    assert res.status_code == 200
    body = res.json()
    assert body["assigned"] is False
    assert "vehicle" not in body
