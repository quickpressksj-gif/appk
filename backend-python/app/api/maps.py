"""Maps API — Sprint 5.4 (Google Maps production integration).

Every Google call is proxied here so GOOGLE_API_KEY never reaches a browser.
Live rider/partner positions are persisted in MongoDB (`live_locations`) so the
admin live map and customer order tracking read real coordinates.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import get_settings
from app.core import maps
from app.core.deps import current_user
from app.db.client import database
from app.models.maps import (
    DeliveryAreaRequest,
    DeliveryAreaResponse,
    GeocodeResult,
    LiveLocation,
    LiveLocationUpdate,
    LiveMapResponse,
    MapsStatus,
    MatrixElement,
    MatrixRequest,
    PlaceDetails,
    PlaceSuggestion,
    RouteRequest,
    RouteResult,
)
from app.models.user import User

router = APIRouter(prefix="/maps", tags=["maps"])

LIVE_LOCATIONS = "live_locations"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/status", response_model=MapsStatus)
async def maps_status() -> MapsStatus:
    settings = get_settings()
    return MapsStatus(
        configured=maps.maps_configured(),
        defaultRadiusKm=settings.delivery_radius_km,
        features=["geocode", "reverse-geocode", "autocomplete", "route", "matrix", "live-tracking"],
    )


# --------------------------------------------------------------------------
# Geocoding
# --------------------------------------------------------------------------


@router.get("/geocode", response_model=GeocodeResult)
async def geocode_address(address: str = Query(..., min_length=3, max_length=300)) -> GeocodeResult:
    return GeocodeResult(**await maps.geocode(address.strip()))


@router.get("/reverse-geocode", response_model=GeocodeResult)
async def reverse_geocode(
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
) -> GeocodeResult:
    actual_lat = lat if lat is not None else latitude
    actual_lng = lng if lng is not None else longitude
    if actual_lat is None or actual_lng is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="latitude and longitude (or lat and lng) are required query parameters",
        )
    return GeocodeResult(**await maps.reverse_geocode(actual_lat, actual_lng))


# --------------------------------------------------------------------------
# Places (New) — autocomplete + details
# --------------------------------------------------------------------------


@router.get("/autocomplete", response_model=List[PlaceSuggestion])
async def autocomplete(
    q: str = Query(..., min_length=2, max_length=200),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius: int = Query(30_000, ge=100, le=50_000),
) -> List[PlaceSuggestion]:
    actual_lat = lat if lat is not None else latitude
    actual_lng = lng if lng is not None else longitude
    results = await maps.autocomplete(q.strip(), actual_lat, actual_lng, radius)
    return [PlaceSuggestion(**item) for item in results]


@router.get("/place/{place_id}", response_model=PlaceDetails)
async def place(place_id: str) -> PlaceDetails:
    return PlaceDetails(**await maps.place_details(place_id))


# --------------------------------------------------------------------------
# Routes, distance and ETA
# --------------------------------------------------------------------------


@router.post("/route", response_model=RouteResult)
async def compute_route(body: RouteRequest) -> RouteResult:
    result = await maps.compute_route(
        (body.origin.latitude, body.origin.longitude),
        (body.destination.latitude, body.destination.longitude),
        body.travelMode,
    )
    return RouteResult(**result)


@router.post("/distance-matrix", response_model=List[MatrixElement])
async def distance_matrix(body: MatrixRequest) -> List[MatrixElement]:
    if not body.origins or not body.destinations:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="origins and destinations are required")
    if len(body.origins) * len(body.destinations) > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Matrix too large (max 100 pairs)")
    rows = await maps.route_matrix(
        [(o.latitude, o.longitude) for o in body.origins],
        [(d.latitude, d.longitude) for d in body.destinations],
        body.travelMode,
    )
    return [MatrixElement(**row) for row in rows]


@router.post("/eta", response_model=RouteResult)
async def compute_eta(body: RouteRequest) -> RouteResult:
    return await compute_route(body)


# --------------------------------------------------------------------------
# Delivery radius / serviceability
# --------------------------------------------------------------------------


@router.post("/delivery-area", response_model=DeliveryAreaResponse)
async def delivery_area(body: DeliveryAreaRequest) -> DeliveryAreaResponse:
    settings = get_settings()
    radius = float(body.radiusKm or settings.delivery_radius_km)
    partners: List[Dict[str, Any]] = await database.find_many("partners")
    if body.partnerId:
        partners = [p for p in partners if p.get("_id") == body.partnerId or p.get("id") == body.partnerId]

    scored = []
    for partner in partners:
        latitude, longitude = partner.get("latitude"), partner.get("longitude")
        if latitude is None or longitude is None:
            continue
        distance = maps.haversine_km((body.latitude, body.longitude), (float(latitude), float(longitude)))
        scored.append((distance, partner))
    scored.sort(key=lambda item: item[0])

    in_range = [item for item in scored if item[0] <= radius]
    nearest = None
    if scored:
        distance, partner = scored[0]
        nearest = {
            "id": str(partner.get("_id") or partner.get("id") or ""),
            "name": str(partner.get("name") or ""),
            "distanceKm": distance,
            "withinRadius": distance <= radius,
        }

    serviceable = bool(in_range)
    return DeliveryAreaResponse(
        serviceable=serviceable,
        radiusKm=radius,
        partnersInRange=len(in_range),
        nearest=nearest,  # type: ignore[arg-type]
        message=(
            f"{len(in_range)} partner(s) deliver to this location"
            if serviceable
            else f"No partner serves this location within {radius:g} km"
        ),
    )


# --------------------------------------------------------------------------
# Live tracking
# --------------------------------------------------------------------------


@router.post("/live/rider", response_model=LiveLocation)
async def push_rider_location(
    body: LiveLocationUpdate,
    user: User = Depends(current_user),
) -> LiveLocation:
    from app.db.rider_repositories import rider_profile_repository

    rider_id = body.riderId or await rider_profile_repository.resolve_rider_id(user)
    document = {
        "_id": f"rider:{rider_id}",
        "kind": "rider",
        "label": rider_id,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "orderId": body.orderId,
        "heading": body.heading,
        "speedKmph": body.speedKmph,
        "status": "on-trip" if body.orderId else "online",
        "updatedAt": _now(),
    }
    await database.update(LIVE_LOCATIONS, {"_id": document["_id"]}, document, upsert=True)
    return LiveLocation(id=str(rider_id), **{k: v for k, v in document.items() if k in {"kind", "label", "latitude", "longitude", "orderId", "status", "updatedAt"}})


@router.get("/live/rider/{rider_id}", response_model=Optional[LiveLocation])
async def read_rider_location(rider_id: str):
    document = await database.find_one(LIVE_LOCATIONS, {"_id": f"rider:{rider_id}"})
    if not document:
        return None
    return LiveLocation(
        id=rider_id,
        kind="rider",
        label=str(document.get("label") or rider_id),
        latitude=float(document.get("latitude", 0.0)),
        longitude=float(document.get("longitude", 0.0)),
        orderId=document.get("orderId"),
        status=document.get("status"),
        updatedAt=document.get("updatedAt"),
    )


@router.get("/live", response_model=LiveMapResponse)
async def live_map() -> LiveMapResponse:
    documents: List[Dict[str, Any]] = await database.find_many(LIVE_LOCATIONS)
    riders = [
        LiveLocation(
            id=str(document.get("_id", "")).split(":", 1)[-1],
            kind="rider",
            label=str(document.get("label") or ""),
            latitude=float(document.get("latitude", 0.0)),
            longitude=float(document.get("longitude", 0.0)),
            orderId=document.get("orderId"),
            status=document.get("status"),
            updatedAt=document.get("updatedAt"),
        )
        for document in documents
        if document.get("kind") == "rider"
    ]

    partner_documents: List[Dict[str, Any]] = await database.find_many("partners")
    partners = [
        LiveLocation(
            id=str(partner.get("_id") or partner.get("id") or ""),
            kind="partner",
            label=str(partner.get("name") or ""),
            latitude=float(partner.get("latitude") or 0.0),
            longitude=float(partner.get("longitude") or 0.0),
            status=str(partner.get("status") or "open"),
        )
        for partner in partner_documents
        if partner.get("latitude") is not None and partner.get("longitude") is not None
    ]

    active = [rider for rider in riders if rider.orderId]
    return LiveMapResponse(riders=riders, partners=partners, customers=[], activeOrders=active)
