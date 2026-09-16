"""
Field Incident Reports & File Upload Router.
Provides binary image upload (JPEG, PNG, WebP) with MIME validation, magic-byte checks,
file size limits (5MB), safe filename generation, and ground report submission.
"""

import os
import uuid
from fastapi import APIRouter, Form, UploadFile, File, HTTPException, status, Depends
from app.services import reports_service
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/reports", tags=["reports"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB limit

# Magic byte signatures for JPEG, PNG, WEBP
MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp"
}


def _verify_file_magic(header: bytes) -> bool:
    for magic, mime in MAGIC_BYTES.items():
        if header.startswith(magic):
            return True
    return False


@router.get("")
def list_reports(user: dict = Depends(get_current_user)):
    return reports_service.REPORTS


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user: dict = Depends(require_roles(
        ["FIELD_OFFICER", "DRIVER", "LOCAL_USER", "LOGISTICS_OPERATOR", "EMERGENCY_OPERATOR", "ADMIN", "SUPER_ADMIN"]
    ))
):
    """
    Binary multipart file upload for field evidence images.
    Enforces MIME validation, magic byte checks, file size limits (5MB), and safe UUID filename storage.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing in upload payload.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed: {list(ALLOWED_EXTENSIONS)}"
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type '{file.content_type}'. Allowed: {list(ALLOWED_MIME_TYPES)}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds 5MB limit ({len(content)} bytes uploaded)."
        )

    if not _verify_file_magic(content[:16]):
        raise HTTPException(
            status_code=400,
            detail="File content header does not match valid JPEG, PNG, or WebP magic bytes."
        )

    safe_fname = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_fname)

    with open(dest_path, "wb") as f:
        f.write(content)

    return {
        "status": "SUCCESS",
        "file_url": f"/uploads/{safe_fname}",
        "filename": safe_fname,
        "size_bytes": len(content),
        "uploaded_by": user.get("fullName")
    }


@router.post("")
async def create_report(
    reporter_name: str = Form(...),
    phone: str = Form(""),
    incident_type: str = Form(...),
    description: str = Form(""),
    lat: float = Form(...),
    lon: float = Form(...),
    captured_at: str | None = Form(None),
    photo: UploadFile | None = File(None),
    user: dict = Depends(require_roles(
        ["FIELD_OFFICER", "EMERGENCY_OPERATOR", "ADMIN", "SUPER_ADMIN", "DRIVER", "LOCAL_USER"]
    ))
):
    """
    captured_at: ISO-8601 timestamp of when the photo/report was captured on
    the reporting device (set client-side at the moment of capture, distinct
    from server-side created_at). The mobile app also burns this same GPS +
    timestamp as a visible watermark onto the photo itself before upload, so
    the caption is corroborated by the image even if it's later exported out
    of this system.
    """
    photo_path = None
    if photo is not None and photo.filename:
        ext = os.path.splitext(photo.filename)[1].lower() or ".jpg"
        if ext in ALLOWED_EXTENSIONS:
            content = await photo.read()
            if len(content) <= MAX_FILE_SIZE_BYTES and _verify_file_magic(content[:16]):
                safe_fname = f"{uuid.uuid4().hex}{ext}"
                dest = os.path.join(UPLOAD_DIR, safe_fname)
                with open(dest, "wb") as f:
                    f.write(content)
                photo_path = f"/uploads/{safe_fname}"

    report = await reports_service.submit_report(
        reporter_name, phone, incident_type, description, lat, lon, photo_path, captured_at
    )
    return report
