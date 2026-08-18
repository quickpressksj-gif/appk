/**
 * Mock implementations of the /api/maps/* endpoints.
 *
 * They keep the preview (VITE_API_BASE_URL unset) working exactly like the
 * FastAPI Google Maps proxy: same shapes, deterministic values, no network.
 */

import { getDb, mutateDb } from "./db";

type LatLng = { latitude: number; longitude: number };

const CITY_CENTER: LatLng = { latitude: 12.9352, longitude: 77.6245 };

const AREAS = [
  { area: "Koramangala 5th Block", city: "Bengaluru", state: "Karnataka", pincode: "560095" },
  { area: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
  { area: "HSR Layout Sector 2", city: "Bengaluru", state: "Karnataka", pincode: "560102" },
  { area: "Jayanagar 4th Block", city: "Bengaluru", state: "Karnataka", pincode: "560011" },
  { area: "Whitefield", city: "Bengaluru", state: "Karnataka", pincode: "560066" },
  { area: "Andheri West", city: "Mumbai", state: "Maharashtra", pincode: "400058" },
  { area: "Bandra Kurla Complex", city: "Mumbai", state: "Maharashtra", pincode: "400051" },
];

function seededOffset(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }
  return (hash % 1000) / 10000;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return Number((2 * radius * Math.asin(Math.sqrt(h))).toFixed(2));
}

/** Minimal Google polyline encoder so mock routes render on a real map. */
export function encodePolyline(points: LatLng[]): string {
  let lastLat = 0;
  let lastLng = 0;
  let output = "";

  const encodeValue = (value: number) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    let chunk = "";
    while (v >= 0x20) {
      chunk += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    chunk += String.fromCharCode(v + 63);
    return chunk;
  };

  for (const point of points) {
    const lat = Math.round(point.latitude * 1e5);
    const lng = Math.round(point.longitude * 1e5);
    output += encodeValue(lat - lastLat) + encodeValue(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return output;
}

function areaFor(seed: string) {
  const entry = AREAS[Math.floor(seededOffset(seed) * 10000) % AREAS.length]!;
  return entry;
}

export function mockGeocode(address: string) {
  const entry = areaFor(address);
  const offset = seededOffset(address);
  return {
    formattedAddress: `${address}, ${entry.area}, ${entry.city} ${entry.pincode}`,
    placeId: `mock_place_${Math.abs(Math.floor(offset * 1e6))}`,
    latitude: Number((CITY_CENTER.latitude + offset).toFixed(6)),
    longitude: Number((CITY_CENTER.longitude + offset / 2).toFixed(6)),
    area: entry.area,
    city: entry.city,
    state: entry.state,
    pincode: entry.pincode,
    country: "India",
  };
}

export function mockReverseGeocode(latitude: number, longitude: number) {
  const entry = areaFor(`${latitude.toFixed(3)},${longitude.toFixed(3)}`);
  return {
    formattedAddress: `${entry.area}, ${entry.city}, ${entry.state} ${entry.pincode}`,
    placeId: `mock_place_${Math.abs(Math.round(latitude * 1000))}`,
    latitude,
    longitude,
    area: entry.area,
    city: entry.city,
    state: entry.state,
    pincode: entry.pincode,
    country: "India",
  };
}

export function mockAutocomplete(query: string) {
  const term = query.trim().toLowerCase();
  if (term.length < 2) return [];
  const matches = AREAS.filter((entry) =>
    `${entry.area} ${entry.city}`.toLowerCase().includes(term),
  );
  const pool = matches.length > 0 ? matches : AREAS.slice(0, 4);
  return pool.slice(0, 5).map((entry, index) => ({
    placeId: `mock_place_${entry.pincode}_${index}`,
    primaryText: matches.length > 0 ? entry.area : `${query} — ${entry.area}`,
    secondaryText: `${entry.city}, ${entry.state}`,
    description: `${entry.area}, ${entry.city}, ${entry.state} ${entry.pincode}`,
  }));
}

export function mockPlaceDetails(placeId: string) {
  const entry = areaFor(placeId);
  const offset = seededOffset(placeId);
  return {
    placeId,
    name: entry.area,
    formattedAddress: `${entry.area}, ${entry.city}, ${entry.state} ${entry.pincode}`,
    latitude: Number((CITY_CENTER.latitude + offset).toFixed(6)),
    longitude: Number((CITY_CENTER.longitude + offset / 2).toFixed(6)),
    area: entry.area,
    city: entry.city,
    state: entry.state,
    pincode: entry.pincode,
  };
}

export function mockRoute(origin: LatLng, destination: LatLng) {
  const distanceKm = Math.max(0.4, haversineKm(origin, destination));
  const durationSeconds = Math.round((distanceKm / 22) * 3600);
  const midpoint: LatLng = {
    latitude: (origin.latitude + destination.latitude) / 2 + 0.004,
    longitude: (origin.longitude + destination.longitude) / 2 - 0.003,
  };
  return {
    polyline: encodePolyline([origin, midpoint, destination]),
    distanceMeters: Math.round(distanceKm * 1000),
    distanceKm,
    durationSeconds,
    etaMinutes: Math.max(1, Math.round(durationSeconds / 60)),
    trafficDelayMinutes: distanceKm > 4 ? 3 : 1,
    steps: [
      { instruction: "Head north on the service road", maneuver: "straight", distanceMeters: 450 },
      { instruction: "Turn right at the signal", maneuver: "turn-right", distanceMeters: 900 },
      {
        instruction: "Continue to the drop point",
        maneuver: "straight",
        distanceMeters: Math.max(200, Math.round(distanceKm * 1000) - 1350),
      },
    ],
  };
}

export function mockMatrix(origins: LatLng[], destinations: LatLng[]) {
  const elements: ReturnType<typeof element>[] = [];
  function element(originIndex: number, destinationIndex: number, distanceKm: number) {
    const durationSeconds = Math.round((distanceKm / 22) * 3600);
    return {
      originIndex,
      destinationIndex,
      distanceMeters: Math.round(distanceKm * 1000),
      distanceKm,
      durationSeconds,
      etaMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      reachable: true,
    };
  }
  origins.forEach((origin, originIndex) => {
    destinations.forEach((destination, destinationIndex) => {
      elements.push(
        element(originIndex, destinationIndex, Math.max(0.4, haversineKm(origin, destination))),
      );
    });
  });
  return elements;
}

const DEFAULT_RADIUS_KM = 8;

export function mockDeliveryArea(body: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  partnerId?: string;
}) {
  const radiusKm = body.radiusKm ?? DEFAULT_RADIUS_KM;
  const origin: LatLng = { latitude: body.latitude, longitude: body.longitude };
  const partners = getDb().partners;

  const ranked = partners
    .map((partner, index) => {
      const point: LatLng = {
        latitude: CITY_CENTER.latitude + seededOffset(partner.id + index) * 4,
        longitude: CITY_CENTER.longitude + seededOffset(partner.name + index) * 4,
      };
      return { partner, distanceKm: haversineKm(origin, point) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearest = ranked[0] ?? null;
  const partnersInRange = ranked.filter((entry) => entry.distanceKm <= radiusKm).length;
  const serviceable = partnersInRange > 0;

  return {
    serviceable,
    radiusKm,
    message: serviceable
      ? `${partnersInRange} partner${partnersInRange === 1 ? "" : "s"} serve this location.`
      : `No partner within ${radiusKm} km of this location yet.`,
    nearest: nearest
      ? {
          id: nearest.partner.id,
          name: nearest.partner.name,
          distanceKm: nearest.distanceKm,
          withinRadius: nearest.distanceKm <= radiusKm,
        }
      : null,
    partnersInRange,
  };
}

type StoredLive = {
  id: string;
  kind: "rider" | "partner" | "customer";
  label: string;
  latitude: number;
  longitude: number;
  orderId?: string | null;
  status?: string | null;
  updatedAt?: string | null;
};

const liveLocations = new Map<string, StoredLive>();

export function mockPushRiderLocation(
  riderId: string,
  riderName: string,
  body: { latitude: number; longitude: number; orderId?: string; heading?: number },
): StoredLive {
  const record: StoredLive = {
    id: riderId,
    kind: "rider",
    label: riderName,
    latitude: body.latitude,
    longitude: body.longitude,
    orderId: body.orderId ?? null,
    status: "online",
    updatedAt: new Date().toISOString(),
  };
  liveLocations.set(riderId, record);
  // Keep the in-memory db in sync so admin lists show a fresh fix too.
  mutateDb((db) => {
    const rider = db.riders.find((item) => item.id === riderId);
    if (rider) Object.assign(rider as Record<string, unknown>, { isOnline: true });
    return null;
  });
  return record;
}

export function mockRiderLocation(riderId: string): StoredLive | null {
  return liveLocations.get(riderId) ?? null;
}

export function mockLiveMap() {
  const db = getDb();
  const riders = db.riders.map((rider, index) => {
    const stored = liveLocations.get(rider.id);
    return (
      stored ?? {
        id: rider.id,
        kind: "rider" as const,
        label: rider.name,
        latitude: CITY_CENTER.latitude + seededOffset(rider.id + index) * 2,
        longitude: CITY_CENTER.longitude + seededOffset(rider.name + index) * 2,
        orderId: null,
        status: rider.isOnline ? "online" : "offline",
        updatedAt: new Date().toISOString(),
      }
    );
  });

  const partners = db.partners.map((partner, index) => ({
    id: partner.id,
    kind: "partner" as const,
    label: partner.name,
    latitude: CITY_CENTER.latitude + seededOffset(partner.id + index) * 4,
    longitude: CITY_CENTER.longitude + seededOffset(partner.name + index) * 4,
    orderId: null,
    status: "active",
    updatedAt: new Date().toISOString(),
  }));

  const activeOrders = db.orders
    .filter((order) => order.status !== "delivered" && order.status !== "cancelled")
    .slice(0, 12)
    .map((order, index) => ({
      id: order.id,
      kind: "customer" as const,
      label: `Order ${order.id}`,
      latitude: CITY_CENTER.latitude + seededOffset(order.id + index) * 3,
      longitude: CITY_CENTER.longitude + seededOffset(order.id + "d" + index) * 3,
      orderId: order.id,
      status: order.status,
      updatedAt: new Date().toISOString(),
    }));

  return { riders, partners, customers: [], activeOrders };
}

export const MOCK_MAPS_STATUS = {
  configured: false,
  defaultRadiusKm: DEFAULT_RADIUS_KM,
  features: ["geocode", "reverse-geocode", "autocomplete", "route", "distance-matrix", "live"],
};
