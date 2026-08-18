import { reverseGeocodeCoords } from "../core/maps-api";

export type SavedLocation = {

  area: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
};

const KEY = "quickpress:location";

export function saveLocation(location: SavedLocation) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(location));
  } catch {
    /* storage unavailable */
  }
}

export function readLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
}

/**
 * Reverse geocode coordinates into a readable area/city.
 *
 * Primary source is the backend Google Maps proxy (`/api/maps/reverse-geocode`,
 * server key). OpenStreetMap stays as a last-resort fallback so GPS keeps
 * working when Maps is unavailable.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<SavedLocation> {
  const fallback: SavedLocation = {
    area: "Current Location",
    city: "Detected via GPS",
    state: "",
    latitude,
    longitude,
  };

  try {
    const result = await reverseGeocodeCoords(latitude, longitude);
    if (result.area || result.city) {
      return {
        area: result.area || result.formattedAddress || fallback.area,
        city: result.city || fallback.city,
        state: result.state ?? "",
        latitude,
        longitude,
      };
    }
  } catch {
    /* fall through to OpenStreetMap */
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) return fallback;
    const json = (await response.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };
    const a = json.address ?? {};
    const area =
      a["neighbourhood"] ??
      a["suburb"] ??
      a["village"] ??
      a["town"] ??
      a["city_district"] ??
      a["road"] ??
      a["city"] ??
      fallback.area;
    const city = a["city"] ?? a["town"] ?? a["state_district"] ?? a["county"] ?? fallback.city;
    return { area, city, state: a["state"] ?? "", latitude, longitude };
  } catch {
    return fallback;
  }
}


/* --------------------------------------------------------------- device GPS */

export type GeoErrorKind = "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED";

export class GeoError extends Error {
  constructor(public readonly kind: GeoErrorKind) {
    super(
      kind === "PERMISSION_DENIED"
        ? "Location permission is required to detect your current location."
        : kind === "TIMEOUT"
          ? "Timed out while detecting your location."
          : kind === "UNSUPPORTED"
            ? "This device or browser does not support location access."
            : "Unable to detect your location.",
    );
    this.name = "GeoError";
  }
}

export type DeviceLocation = { latitude: number; longitude: number; accuracy?: number };

/**
 * REAL device fix only.
 *
 * There is no fallback coordinate anywhere in this function: a failure is
 * reported as a GeoError so the screen can offer "Retry" or "Choose manually".
 */
export function getCurrentDeviceLocation(
  options: { timeoutMs?: number; enableHighAccuracy?: boolean } = {},
): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new GeoError("UNSUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      (error) =>
        reject(
          new GeoError(
            error.code === error.PERMISSION_DENIED
              ? "PERMISSION_DENIED"
              : error.code === error.TIMEOUT
                ? "TIMEOUT"
                : "POSITION_UNAVAILABLE",
          ),
        ),
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeoutMs ?? 12_000,
        maximumAge: 0,
      },
    );
  });
}

/**
 * Device GPS → reverse geocoding → the customer's *current device* location.
 *
 * This is deliberately separate from the saved default address: it never
 * mutates the address book. Only `saveLocation` (called by explicit user
 * action or by the post-login location screen) updates the active location.
 */
export async function detectDeviceLocation(): Promise<SavedLocation> {
  const fix = await getCurrentDeviceLocation();
  return reverseGeocode(fix.latitude, fix.longitude);
}
