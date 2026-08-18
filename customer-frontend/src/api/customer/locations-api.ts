// Location search data layer — /api/locations, /api/locations/search, /api/countries

import { apiGetJson } from "../core/transport";

export const LOCATIONS_API_ENDPOINTS = {
  locations: "/api/locations",
  search: "/api/locations/search",
  countries: "/api/countries",
  current: "/api/location",
} as const;

export type Place = {
  id: string;
  area: string;
  city: string;
  state: string;
};

export type PlaceGroups = {
  recent: Place[];
  saved: Place[];
  nearby: Place[];
  popular: Place[];
};

/** GET /api/locations */
export async function fetchPlaceGroups(): Promise<PlaceGroups> {
  return apiGetJson<PlaceGroups>(LOCATIONS_API_ENDPOINTS.locations);
}

/** GET /api/locations/search?q= */
export async function searchPlaces(query: string): Promise<Place[]> {
  return apiGetJson<Place[]>(LOCATIONS_API_ENDPOINTS.search, { params: { q: query } });
}

/** GET /api/location — the platform's current default area. */
export async function fetchCurrentArea(): Promise<{ area: string; city: string; state: string }> {
  return apiGetJson<{ area: string; city: string; state: string }>(
    LOCATIONS_API_ENDPOINTS.current,
  );
}
