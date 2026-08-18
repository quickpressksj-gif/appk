/** GET/POST /api/admin/cities — real cities and their areas. Delivery zones have no backend endpoint yet. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

export type AdminCity = {
  id: string;
  city: string;
  state: string;
  areas: number;
  partners: number;
  riders: number;
  pickupRadius: string;
  status: "Live" | "Pilot" | "Paused";
};

export type AdminArea = {
  id: string;
  area: string;
  city: string;
  pincode: string;
  zone: string;
  status: "Live" | "Paused";
};

export type DeliveryZone = {
  id: string;
  zone: string;
  city: string;
  areas: number;
  slots: string;
  radius: string;
};

type BackendCity = {
  _id: string;
  city: string;
  state: string;
  areas: number;
  partners: number;
  riders: number;
  pickupRadius: string;
  status: string;
};

type BackendArea = { id: string; area: string; city: string; status: string };

function toCity(row: BackendCity): AdminCity {
  return {
    id: row._id,
    city: row.city,
    state: row.state,
    areas: row.areas ?? 0,
    partners: row.partners ?? 0,
    riders: row.riders ?? 0,
    pickupRadius: row.pickupRadius || "—",
    status: (row.status as AdminCity["status"]) ?? "Pilot",
  };
}

export async function fetchCities(): Promise<AdminCity[]> {
  const rows = await apiGetJson<BackendCity[]>("/api/admin/cities");
  return rows.map(toCity);
}

/** The backend derives areas per-city (no pincode/zone data yet), so we fetch and flatten them. */
export async function fetchAreas(): Promise<AdminArea[]> {
  const cities = await apiGetJson<BackendCity[]>("/api/admin/cities");
  const perCity = await Promise.all(
    cities.map((c) =>
      apiGetJson<BackendArea[]>(`/api/admin/cities/${c._id}/areas`).catch(() => [] as BackendArea[]),
    ),
  );
  return perCity.flat().map((row) => ({
    id: row.id,
    area: row.area,
    city: row.city,
    pincode: "—",
    zone: "—",
    status: (row.status as AdminArea["status"]) ?? "Live",
  }));
}

/** No delivery-zone endpoint exists on the backend yet. */
export async function fetchZones(): Promise<DeliveryZone[]> {
  return [];
}

export function saveCity(payload: { city: string; state: string; pickupRadius: string }) {
  return apiPostJson<BackendCity>("/api/admin/cities", {
    city: payload.city,
    state: payload.state,
    pickupRadius: payload.pickupRadius,
  });
}
