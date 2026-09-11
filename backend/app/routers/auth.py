import os
import time
import uuid
import jwt
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

# NOTE ON ARCHITECTURE: this router's USERS_DB is an in-memory, self-described
# "demo/fallback" identity store (kept for zero-setup local demos launched via
# start.bat). The Admin Console's real, persistent user directory and account
# lifecycle (provision/suspend/reactivate/deactivate/change-role/change-district)
# live in backend/auth-service (Express + SQLite via Drizzle) -- see
# docs/ADMIN_CONSOLE_IMPLEMENTATION_SPEC.md. Adding a second, competing
# lifecycle API surface here would duplicate that system, so this file is
# limited to security-hardening the endpoints it already exposed (login,
# register, refresh, me) rather than growing new admin-governance endpoints.
from app.auth import get_current_user, require_roles
from app.graph_data import NODES

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-demo-key-123")
JWT_ALGORITHM = "HS256"

# Canonical 5-role model (docs/architecture/ROLE_MODEL.md). SUPER_ADMIN and
# DISTRICT_AUTHORITY are legacy aliases normalized elsewhere -- they are never
# valid values to provision or assign directly.
ALLOWED_ROLES = {"ADMIN", "EMERGENCY_OPERATOR", "LOGISTICS_OPERATOR", "FIELD_OFFICER", "DRIVER"}
# Canonical NER district list, sourced from the same road-network topology
# used by the routing/GIS engine -- keeps "district" meaningful everywhere.
CANONICAL_DISTRICTS = {n["district"] for n in NODES.values()}

# In-memory user database for demo/fallback
USERS_DB = {
    "officer@nerlogisense.gov.in": {
        "userId": "usr_off_01",
        "fullName": "Rajesh Kumar",
        "email": "officer@nerlogisense.gov.in",
        "phone": "+919876543210",
        "role": "FIELD_OFFICER",
        "district": "East Khasi Hills",
        "organization": "Meghalaya Disaster Management Authority",
        "password": "password123",
        "status": "ACTIVE",
    },
    "driver@nerlogisense.gov.in": {
        "userId": "usr_drv_01",
        "fullName": "Amit Sharma",
        "email": "driver@nerlogisense.gov.in",
        "phone": "+919876543211",
        "role": "DRIVER",
        "district": "Kamrup Metro",
        "organization": "NER Logistics Fleet",
        "password": "password123",
        "status": "ACTIVE",
    },
    "admin@nerlogisense.gov.in": {
        "userId": "usr_adm_01",
        "fullName": "Dr. S. Roy",
        "email": "admin@nerlogisense.gov.in",
        "phone": "+919876543212",
        "role": "ADMIN",
        "district": "East Khasi Hills",
        "organization": "NER LogiSense Command Center",
        "password": "password123",
        "status": "ACTIVE",
    },
    "logistics@nerlogisense.gov.in": {
        "userId": "usr_log_01",
        "fullName": "Priya Sharma",
        "email": "logistics@nerlogisense.gov.in",
        "phone": "+919876543213",
        "role": "LOGISTICS_OPERATOR",
        "district": "Kamrup Metro",
        "organization": "NER Logistics Command Center",
        "password": "password123",
        "status": "ACTIVE",
    }
}


def _find_user_by_id(user_id: str) -> dict | None:
    return next((u for u in USERS_DB.values() if u["userId"] == user_id), None)


def _public_user(u: dict) -> dict:
    """Strips the password field before a user record leaves this service."""
    return {k: v for k, v in u.items() if k != "password"}


def _require_live_admin(user: dict) -> dict:
    """require_roles() only trusts the role claim inside the JWT. For the
    sensitive governance endpoints below we additionally re-check the caller's
    *current* account record, so an admin token issued before that same admin
    was suspended/deactivated cannot keep exercising governance authority for
    the remainder of its (short) lifetime."""
    caller_email = str(user.get("email", "")).lower()
    caller = USERS_DB.get(caller_email)
    if not caller or caller.get("status", "ACTIVE") != "ACTIVE":
        raise HTTPException(403, "Your administrator account is no longer active.")
    return caller

class LoginInput(BaseModel):
    identifier: str | None = None
    email: str | None = None
    phone: str | None = None
    password: str

class RegisterInput(BaseModel):
    email: str
    fullName: str
    phone: str = ""
    password: str = Field(..., min_length=8)
    role: str = "FIELD_OFFICER"
    district: str = "East Khasi Hills"
    organization: str = "NER Logistics"

class RefreshInput(BaseModel):
    refreshToken: str
    sessionId: str

class LogoutInput(BaseModel):
    sessionId: str | None = None

def generate_tokens(user_data: dict):
    now = int(time.time())
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    
    access_payload = {
        "sub": user_data["userId"],
        "email": user_data["email"],
        "role": user_data["role"],
        "fullName": user_data["fullName"],
        "phone": user_data.get("phone", ""),
        "district": user_data.get("district", ""),
        "organization": user_data.get("organization", ""),
        "sessionId": session_id,
        "iat": now,
        "exp": now + (15 * 60)  # 15 minutes
    }
    
    refresh_payload = {
        "sub": user_data["userId"],
        "sessionId": session_id,
        "iat": now,
        "exp": now + (7 * 24 * 3600)  # 7 days
    }
    
    access_token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "sessionId": session_id,
        "user": {
            "userId": user_data["userId"],
            "fullName": user_data["fullName"],
            "email": user_data["email"],
            "phone": user_data.get("phone", ""),
            "role": user_data["role"],
            "district": user_data.get("district", ""),
            "organization": user_data.get("organization", "")
        }
    }

@router.post("/login")
def login(payload: LoginInput):
    target = payload.identifier or payload.email or payload.phone
    if not target:
        raise HTTPException(400, "Identifier, email, or phone is required")

    # SECURITY: Closed-provisioning system -- there is no self-registration,
    # so login must never create an account for an unrecognized identifier.
    # Accounts exist only because an ADMIN provisioned them (POST /register).
    user = None
    target_lower = target.lower().strip()

    for u in USERS_DB.values():
        if target_lower in [u["email"].lower(), u["phone"].lower(), u["userId"].lower()]:
            user = u
            break

    # Generic error on both "no such account" and "wrong password" so the
    # response never leaks whether an identifier is provisioned.
    if not user or not user.get("password") or user["password"] != payload.password:
        raise HTTPException(401, "Invalid email or password")

    if user.get("status") in ("SUSPENDED", "DEACTIVATED"):
        raise HTTPException(403, "Account is suspended or deactivated. Contact system administrator.")

    return generate_tokens(user)

@router.post("/register")
def register(payload: RegisterInput, user: dict = Depends(require_roles(["ADMIN"]))):
    # Closed System Security Enforcement: Public self-registration is strictly
    # disabled (docs/architecture/FRONTEND_ROLE_CONTRACT.md #3). Only an
    # authenticated Administrator with a currently-active account may
    # provision new operational accounts.
    _require_live_admin(user)

    role = payload.role.strip().upper()
    if role not in ALLOWED_ROLES:
        raise HTTPException(400, f"Invalid role '{payload.role}'. Must be one of: {sorted(ALLOWED_ROLES)}")

    district = payload.district.strip()
    if district not in CANONICAL_DISTRICTS:
        raise HTTPException(400, f"Unknown district '{payload.district}'. Must be one of the 18 NER districts.")

    if payload.email.lower() in USERS_DB:
        raise HTTPException(400, "User with this email already exists")

    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    new_user = {
        "userId": user_id,
        "fullName": payload.fullName,
        "email": payload.email.lower(),
        "phone": payload.phone,
        "role": role,
        "district": district,
        "organization": payload.organization,
        "password": payload.password,
        "status": "ACTIVE"
    }
    USERS_DB[new_user["email"]] = new_user
    return {"message": "User registered successfully", "user": _public_user(new_user)}

@router.post("/refresh")
def refresh(payload: RefreshInput):
    try:
        decoded = jwt.decode(payload.refreshToken, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception as e:
        raise HTTPException(401, f"Invalid or expired refresh token: {str(e)}")

    user_id = decoded.get("sub")
    user = _find_user_by_id(user_id) if user_id else None
    # SECURITY: A refresh token whose subject no longer resolves to a real
    # account must be rejected outright, never used to mint a fresh access
    # token for a fabricated identity.
    if not user:
        raise HTTPException(401, "Invalid or expired refresh token: account not found")
    if user.get("status") in ("SUSPENDED", "DEACTIVATED"):
        raise HTTPException(403, "Account is suspended or deactivated. Contact system administrator.")

    return generate_tokens(user)

@router.post("/logout")
def logout(payload: LogoutInput = None):
    return {"message": "Logged out successfully"}

@router.get("/me")
def get_me(authorization: str | None = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email", "").lower()
        if email in USERS_DB:
            user_obj = USERS_DB[email]
            if user_obj.get("status") in ["SUSPENDED", "DEACTIVATED"]:
                raise HTTPException(403, "Account is suspended or deactivated. Contact system administrator.")
        return {
            "userId": payload.get("sub"),
            "fullName": payload.get("fullName", "User"),
            "email": payload.get("email", ""),
            "phone": payload.get("phone", ""),
            "role": payload.get("role", "FIELD_OFFICER"),
            "district": payload.get("district", ""),
            "organization": payload.get("organization", "")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(401, f"Invalid or expired access token: {str(e)}")
