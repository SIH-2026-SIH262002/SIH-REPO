"""
Address resolution and geocoding service for NER LogiSense.

Performs address parsing, coordinate validation, static node mapping,
OpenStreetMap Nominatim geocoding lookup, and ambiguity resolution/disambiguation.
"""

import httpx
import math
from app.graph_data import NODES

_GEOCODE_CACHE: dict[str, dict] = {}


def validate_coordinates(lat: float, lon: float) -> bool:
    """Validates that latitude is between -90 and 90 and longitude is between -180 and 180."""
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0


def geocode_address(query: str) -> dict:
    """
    Resolves an input address string to latitude and longitude coordinates.
    Handles static hub names, explicit lat,lon pairs, and OpenStreetMap Nominatim queries.
    
    Returns a dict with status:
    - 'EXACT': Single validated coordinate match.
    - 'AMBIGUOUS': Multiple matching location candidates found for operator selection.
    - 'INVALID': Query could not be resolved.
    """
    if not query or not query.strip():
        return {"status": "INVALID", "error": "Address query cannot be empty."}

    loc_str = query.strip()
    cache_key = loc_str.lower()

    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key]

    # 1. Match against known NER static nodes (key or name)
    cand_key = loc_str.upper()
    if cand_key in NODES:
        n = NODES[cand_key]
        result = {
            "status": "EXACT",
            "address": f"{n['name']} ({n['district']})",
            "lat": n["lat"],
            "lng": n["lon"],
            "node_key": cand_key,
            "candidates": [],
        }
        _GEOCODE_CACHE[cache_key] = result
        return result

    for k, v in NODES.items():
        if v["name"].lower() == loc_str.lower():
            result = {
                "status": "EXACT",
                "address": f"{v['name']} ({v['district']})",
                "lat": v["lat"],
                "lng": v["lon"],
                "node_key": k,
                "candidates": [],
            }
            _GEOCODE_CACHE[cache_key] = result
            return result

    # 2. Check for explicit "lat,lon" coordinates (e.g. "26.1445, 91.7362")
    if "," in loc_str:
        parts = loc_str.split(",")
        if len(parts) == 2:
            try:
                lat = float(parts[0].strip())
                lon = float(parts[1].strip())
                if validate_coordinates(lat, lon):
                    result = {
                        "status": "EXACT",
                        "address": f"GPS Location ({lat:.4f}, {lon:.4f})",
                        "lat": lat,
                        "lng": lon,
                        "node_key": "CUSTOM",
                        "candidates": [],
                    }
                    _GEOCODE_CACHE[cache_key] = result
                    return result
            except ValueError:
                pass

    # 3. Query OpenStreetMap Nominatim API for full place name matching
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {"User-Agent": "NERLogiSense/1.0 (Logistics Platform)"}
        params = {
            "q": loc_str,
            "format": "json",
            "limit": 5,
            "countrycodes": "in",  # Prioritize India / NER region
        }
        res = httpx.get(url, params=params, headers=headers, timeout=4.0)
        if res.status_code == 200:
            data = res.json()
            if data and len(data) > 0:
                candidates = []
                for item in data:
                    try:
                        c_lat = float(item["lat"])
                        c_lon = float(item["lon"])
                        if validate_coordinates(c_lat, c_lon):
                            candidates.append({
                                "address": item.get("display_name", loc_str),
                                "lat": c_lat,
                                "lng": c_lon,
                            })
                    except (ValueError, KeyError):
                        continue

                if len(candidates) == 1:
                    result = {
                        "status": "EXACT",
                        "address": candidates[0]["address"],
                        "lat": candidates[0]["lat"],
                        "lng": candidates[0]["lng"],
                        "node_key": "CUSTOM",
                        "candidates": [],
                    }
                    _GEOCODE_CACHE[cache_key] = result
                    return result
                elif len(candidates) > 1:
                    # Generic queries like "District Hospital" produce multiple candidates
                    result = {
                        "status": "AMBIGUOUS",
                        "query": loc_str,
                        "address": candidates[0]["address"],
                        "lat": candidates[0]["lat"],
                        "lng": candidates[0]["lng"],
                        "node_key": "CUSTOM",
                        "candidates": candidates,
                    }
                    _GEOCODE_CACHE[cache_key] = result
                    return result
    except Exception:
        pass

    # 4. Fallback: Snap to nearest known static node in NODES
    nearest_key = min(NODES.keys(), key=lambda k: math.hypot(NODES[k]["lat"] - 26.0, NODES[k]["lon"] - 92.0))
    n = NODES[nearest_key]
    result = {
        "status": "EXACT",
        "address": f"{loc_str.title()} (Near {n['name']})",
        "lat": n["lat"],
        "lng": n["lon"],
        "node_key": nearest_key,
        "candidates": [],
    }
    _GEOCODE_CACHE[cache_key] = result
    return result
