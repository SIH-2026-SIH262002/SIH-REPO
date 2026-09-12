from fastapi import APIRouter, HTTPException

from app.translations import STRINGS, LANGUAGES, LANGUAGE_NAMES, NEEDS_NATIVE_REVIEW

router = APIRouter(prefix="/api/i18n", tags=["i18n"])


@router.get("/languages")
def languages():
    return [
        {
            "code": code,
            "name": LANGUAGE_NAMES.get(code, code),
            "needs_native_review": code in NEEDS_NATIVE_REVIEW,
        }
        for code in LANGUAGES
    ]


@router.get("/{lang}")
def strings(lang: str):
    if lang not in STRINGS:
        raise HTTPException(404, f"Unsupported language '{lang}'")
    return STRINGS[lang]
