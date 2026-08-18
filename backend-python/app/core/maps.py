"""Google Maps Platform integration — 100% environment driven.

The API key comes from GOOGLE_API_KEY (see app.config). Nothing is hardcoded
and the key never leaves the server: every browser-facing feature (geocoding,
reverse geocoding, autocomplete, routes, distance, ETA, delivery radius) is
proxied through the /api/maps endpoints.

APIs used (current, non-deprecated surfaces):
  • Geocoding API              maps.googleapis.com/maps/api/geocode/json
  • Places API (New)           places.googleapis.com/v1/places:autocomplete
  • Routes API                 routes.googleapis.com/directions/v2:computeRoutes
  • Route Matrix (Routes API)  routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix
"""

from __future__ import annotations

import json
import math
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

import anyio
from fastapi import HTTPException, status

from app.config import get_settings

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACES_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete"
PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places/"
ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"

TIMEOUT_SECONDS = 12


def maps_configured() -> bool:
    return bool(get_settings().maps_server_key)


def _require_key() -> str:
    key = get_settings().maps_server_key
    if not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GOOGLE_MAPS_SERVER_API_KEY is not configured",
        )
    return key


def _http(
    url: str,
    *,
    method: str = "GET",
    body: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    payload = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=payload, method=method)
    request.add_header("Accept", "application/json")
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    for name, value in (headers or {}).items():
        request.add_header(name, value)
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as error:  # surface Google's own message
        detail = error.read().decode("utf-8", "ignore")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google Maps request failed [{error.code}]: {detail[:500]}",
        ) from error
    except urllib.error.URLError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google Maps unreachable: {error.reason}",
        ) from error


async def _call(
    url: str,
    *,
    method: str = "GET",
    body: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    return await anyio.to_thread.run_sync(
        lambda: _http(url, method=method, body=body, headers=headers)
    )


# --------------------------------------------------------------------------
# Geocoding / reverse geocoding
# --------------------------------------------------------------------------


def _component(components: List[Dict[str, Any]], *types: str) -> str:
    for wanted in types:
        for component in components:
            if wanted in component.get("types", []):
                return component.get("long_name", "")
    return ""


def _map_geocode_result(result: Dict[str, Any]) -> Dict[str, Any]:
    components = result.get("address_components", [])
    location = result.get("geometry", {}).get("location", {})
    return {
        "formattedAddress": result.get("formatted_address", ""),
        "placeId": result.get("place_id", ""),
        "latitude": location.get("lat", 0.0),
        "longitude": location.get("lng", 0.0),
        "area": _component(components, "sublocality_level_1", "sublocality", "neighborhood", "route"),
        "city": _component(components, "locality", "administrative_area_level_3", "administrative_area_level_2"),
        "state": _component(components, "administrative_area_level_1"),
        "pincode": _component(components, "postal_code"),
        "country": _component(components, "country"),
    }


async def geocode(address: str) -> Dict[str, Any]:
    key = _require_key()
    query = urllib.parse.urlencode({"address": address, "key": key})
    data = await _call(f"{GEOCODE_URL}?{query}")
    results = data.get("results", [])
    if data.get("status") not in {"OK", "ZERO_RESULTS"}:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Geocoding failed: {data.get('status')} {data.get('error_message', '')}".strip(),
        )
    if not results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return _map_geocode_result(results[0])


async def reverse_geocode(latitude: float, longitude: float) -> Dict[str, Any]:
    key = _require_key()
    query = urllib.parse.urlencode({"latlng": f"{latitude},{longitude}", "key": key})
    data = await _call(f"{GEOCODE_URL}?{query}")
    results = data.get("results", [])
    if not results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No address for coordinates")
    mapped = _map_geocode_result(results[0])
    mapped["latitude"] = latitude
    mapped["longitude"] = longitude
    return mapped


# --------------------------------------------------------------------------
# Places API (New) — autocomplete + details
# --------------------------------------------------------------------------


async def autocomplete(
    query: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_meters: int = 30_000,
) -> List[Dict[str, Any]]:
    key = _require_key()
    body: Dict[str, Any] = {"input": query}
    if latitude is not None and longitude is not None:
        body["locationBias"] = {
            "circle": {
                "center": {"latitude": latitude, "longitude": longitude},
                "radius": float(radius_meters),
            }
        }
    data = await _call(
        PLACES_AUTOCOMPLETE_URL,
        method="POST",
        body=body,
        headers={"X-Goog-Api-Key": key},
    )
    suggestions: List[Dict[str, Any]] = []
    for item in data.get("suggestions", []):
        place = item.get("placePrediction")
        if not place:
            continue
        suggestions.append(
            {
                "placeId": place.get("placeId", ""),
                "primaryText": place.get("structuredFormat", {}).get("mainText", {}).get("text", ""),
                "secondaryText": place.get("structuredFormat", {})
                .get("secondaryText", {})
                .get("text", ""),
                "description": place.get("text", {}).get("text", ""),
            }
        )
    return suggestions


async def place_details(place_id: str) -> Dict[str, Any]:
    key = _require_key()
    data = await _call(
        f"{PLACES_DETAILS_URL}{urllib.parse.quote(place_id)}",
        headers={
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
        },
    )
    location = data.get("location", {})
    components = [
        {"long_name": c.get("longText", ""), "types": c.get("types", [])}
        for c in data.get("addressComponents", [])
    ]
    return {
        "placeId": data.get("id", place_id),
        "name": data.get("displayName", {}).get("text", ""),
        "formattedAddress": data.get("formattedAddress", ""),
        "latitude": location.get("latitude", 0.0),
        "longitude": location.get("longitude", 0.0),
        "area": _component(components, "sublocality_level_1", "sublocality", "neighborhood", "route"),
        "city": _component(components, "locality", "administrative_area_level_3"),
        "state": _component(components, "administrative_area_level_1"),
        "pincode": _component(components, "postal_code"),
    }


# --------------------------------------------------------------------------
# Routes API — route, polyline, distance, ETA, matrix
# --------------------------------------------------------------------------


def _waypoint(latitude: float, longitude: float) -> Dict[str, Any]:
    return {"location": {"latLng": {"latitude": latitude, "longitude": longitude}}}


def _seconds(value: Any) -> int:
    if isinstance(value, str) and value.endswith("s"):
        try:
            return int(float(value[:-1]))
        except ValueError:
            return 0
    if isinstance(value, (int, float)):
        return int(value)
    return 0


async def compute_route(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    travel_mode: str = "TWO_WHEELER",
) -> Dict[str, Any]:
    key = _require_key()
    body = {
        "origin": _waypoint(*origin),
        "destination": _waypoint(*destination),
        "travelMode": travel_mode,
        "polylineQuality": "HIGH_QUALITY",
    }
    if travel_mode in {"DRIVE", "TWO_WHEELER"}:
        body["routingPreference"] = "TRAFFIC_AWARE"
    data = await _call(
        ROUTES_URL,
        method="POST",
        body=body,
        headers={
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": (
                "routes.duration,routes.staticDuration,routes.distanceMeters,"
                "routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,"
                "routes.legs.steps.distanceMeters"
            ),
        },
    )
    routes = data.get("routes", [])
    if not routes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not available")
    route = routes[0]
    duration = _seconds(route.get("duration"))
    static_duration = _seconds(route.get("staticDuration")) or duration
    distance_meters = int(route.get("distanceMeters", 0))
    steps: List[Dict[str, Any]] = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            instruction = step.get("navigationInstruction", {})
            if not instruction:
                continue
            steps.append(
                {
                    "instruction": instruction.get("instructions", ""),
                    "maneuver": instruction.get("maneuver", ""),
                    "distanceMeters": int(step.get("distanceMeters", 0)),
                }
            )
    return {
        "polyline": route.get("polyline", {}).get("encodedPolyline", ""),
        "distanceMeters": distance_meters,
        "distanceKm": round(distance_meters / 1000, 2),
        "durationSeconds": duration,
        "etaMinutes": max(1, round(duration / 60)),
        "trafficDelayMinutes": max(0, round((duration - static_duration) / 60)),
        "steps": steps[:25],
    }


async def route_matrix(
    origins: List[Tuple[float, float]],
    destinations: List[Tuple[float, float]],
    travel_mode: str = "DRIVE",
) -> List[Dict[str, Any]]:
    key = _require_key()
    body = {
        "origins": [{"waypoint": _waypoint(*origin)} for origin in origins],
        "destinations": [{"waypoint": _waypoint(*destination)} for destination in destinations],
        "travelMode": travel_mode,
    }
    if travel_mode in {"DRIVE", "TWO_WHEELER"}:
        body["routingPreference"] = "TRAFFIC_AWARE"
    data = await _call(
        ROUTE_MATRIX_URL,
        method="POST",
        body=body,
        headers={
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": (
                "originIndex,destinationIndex,duration,distanceMeters,condition"
            ),
        },
    )
    elements = data if isinstance(data, list) else data.get("elements", [])
    rows: List[Dict[str, Any]] = []
    for element in elements:
        distance_meters = int(element.get("distanceMeters", 0))
        duration = _seconds(element.get("duration"))
        rows.append(
            {
                "originIndex": int(element.get("originIndex", 0)),
                "destinationIndex": int(element.get("destinationIndex", 0)),
                "distanceMeters": distance_meters,
                "distanceKm": round(distance_meters / 1000, 2),
                "durationSeconds": duration,
                "etaMinutes": max(1, round(duration / 60)) if duration else 0,
                "reachable": element.get("condition", "ROUTE_EXISTS") == "ROUTE_EXISTS",
            }
        )
    return rows


# --------------------------------------------------------------------------
# Delivery radius validation
# --------------------------------------------------------------------------


def haversine_km(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    d_lat, d_lon = lat2 - lat1, lon2 - lon1
    h = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2) ** 2
    return round(2 * 6371.0088 * math.asin(math.sqrt(h)), 3)
