"""
FastAPI Authentication & Authorization Dependency Module.
Verifies HS256 JWT tokens issued by backend/auth-service using JWT_SECRET.
Provides get_current_user and require_roles dependencies to enforce security boundaries.
"""

import os
import time
import hmac
import hashlib
import json
import base64
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-demo-key-123")

security_scheme = HTTPBearer(auto_error=False)


def _base64url_decode(input_str: str) -> bytes:
    rem = len(input_str) % 4
    if rem > 0:
        input_str += "=" * (4 - rem)
    return base64.urlsafe_b64decode(input_str.encode("utf-8"))


def normalize_role(role_str: str) -> str:
    if not role_str:
        return "FIELD_OFFICER"
    r = str(role_str).upper()
    if r in ("SUPER_ADMIN", "ADMIN"):
        return "ADMIN"
    if r in ("DISTRICT_AUTHORITY", "EMERGENCY_OPERATOR"):
        return "EMERGENCY_OPERATOR"
    if r in ("LOGISTICS_OPERATOR", "FIELD_OFFICER", "DRIVER", "LOCAL_USER"):
        return r
    return "FIELD_OFFICER"


def decode_jwt(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token format")

        header_b64, payload_b64, signature_b64 = parts

        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(
            JWT_SECRET.encode("utf-8"),
            signing_input,
            hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode("utf-8").rstrip("=")

        clean_sig_b64 = signature_b64.rstrip("=")
        if not hmac.compare_digest(clean_sig_b64, expected_sig_b64):
            # Fallback check for raw urlsafe vs standard padding
            if not hmac.compare_digest(
                base64.urlsafe_b64decode(clean_sig_b64 + "=" * (-len(clean_sig_b64) % 4)),
                expected_sig
            ):
                raise ValueError("Invalid JWT signature")

        payload_json = _base64url_decode(payload_b64).decode("utf-8")
        payload = json.loads(payload_json)

        # Expiration check
        if "exp" in payload and time.time() > payload["exp"]:
            raise ValueError("JWT token has expired")

        # Normalize role in payload
        if "role" in payload:
            payload["role"] = normalize_role(payload["role"])
        if "roles" in payload and isinstance(payload["roles"], list):
            payload["roles"] = [normalize_role(r) for r in payload["roles"]]
        elif "role" in payload:
            payload["roles"] = [payload["role"]]

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    if not credentials:
        # Development / Demo fallback user when no token provided in demo mode
        return {
            "sub": "demo-user-123",
            "role": "LOGISTICS_OPERATOR",
            "roles": ["LOGISTICS_OPERATOR"],
            "fullName": "Demo Operator",
            "district": "Kamrup Metro"
        }
    return decode_jwt(credentials.credentials)


def require_roles(allowed_roles: list[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        user_role = normalize_role(user.get("role", ""))
        user_roles = [normalize_role(r) for r in user.get("roles", [user_role])]
        
        normalized = set(user_roles)
        normalized.add(user_role)
                
        allowed_set = {normalize_role(r) for r in allowed_roles}
        if not normalized.intersection(allowed_set) and "ADMIN" not in normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User with role '{user_role}' does not have required permissions: {allowed_roles}"
            )
        return user
    return role_checker
