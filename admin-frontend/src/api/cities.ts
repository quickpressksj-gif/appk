/**
 * India-Wide Cities, States, Areas & Performance Analytics API Client
 *
 * GET /api/admin/cities           -> All cities with live MongoDB metrics
 * PATCH /api/admin/cities/{id}/status -> Launch, Pause, Activate city
 * GET /api/admin/states           -> State-level aggregation across India
 * GET /api/admin/areas            -> Localities & Delivery Zones
 * POST /api/admin/areas           -> Add new area
 * DELETE /api/admin/areas/{id}    -> Remove area
 */
import { apiGetJson, apiPostJson, apiPutJson, apiPatchJson, apiDeleteJson } from "@/api/core/transport";

export type AdminCity = {
  id: string;
  city: string;
  state: string;
  country: string;
  areas: number;
  partners: number;
  activePartners: number;
  riders: number;
  onlineRiders: number;
  customers: number;
  orders: number;
  todayOrders: number;
  sales: number;
  revenue: number;
  platformEarnings: number;
  partnerEarnings: number;
  pickupRadius: string;
  status: "Live" | "Pilot" | "Paused" | "Coming Soon";
};

export type AdminState = {
  state: string;
  citiesCount: number;
  liveCities: number;
  partners: number;
  riders: number;
  customers: number;
  orders: number;
  sales: number;
};

export type AdminArea = {
  id: string;
  area: string;
  city: string;
  cityId?: string;
  state?: string;
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

export async function fetchCities(): Promise<AdminCity[]> {
  const rows = await apiGetJson<AdminCity[]>("/api/admin/cities");
  return rows.map((r) => ({
    ...r,
    id: (r as any)._id || r.id,
    country: r.country || "India",
    state: r.state || "Uttar Pradesh",
    status: (r.status as any) || "Live",
  }));
}

export async function fetchStates(): Promise<AdminState[]> {
  return await apiGetJson<AdminState[]>("/api/admin/states");
}

export async function fetchAreas(cityId?: string): Promise<AdminArea[]> {
  const q = cityId ? `?cityId=${cityId}` : "";
  const rows = await apiGetJson<any[]>(`/api/admin/areas${q}`);
  return rows.map((r) => ({
    id: r._id || r.id,
    area: r.area,
    city: r.city,
    cityId: r.cityId,
    state: r.state || "Uttar Pradesh",
    pincode: r.pincode || "—",
    zone: r.zone || "Zone 1",
    status: r.status || "Live",
  }));
}

export async function toggleCityStatus(cityId: string, status: "Live" | "Pilot" | "Paused" | "Coming Soon") {
  return await apiPatchJson<AdminCity>(`/api/admin/cities/${cityId}/status`, { status });
}

export async function saveCity(payload: { city: string; state: string; pickupRadius: string; status?: string; areas?: number }) {
  return await apiPostJson<AdminCity>("/api/admin/cities", {
    city: payload.city,
    state: payload.state,
    pickupRadius: payload.pickupRadius,
    status: payload.status || "Live",
    areas: payload.areas || 4,
  });
}

export async function saveArea(payload: { area: string; city: string; state: string; pincode: string; zone: string }) {
  return await apiPostJson<AdminArea>("/api/admin/areas", payload);
}

export async function deleteArea(areaId: string) {
  return await apiDeleteJson<{ ok: boolean }>(`/api/admin/areas/${areaId}`);
}

export async function fetchZones(): Promise<DeliveryZone[]> {
  const cities = await fetchCities();
  return cities.map((c, idx) => ({
    id: `zone-${c.id}`,
    zone: `${c.city} Express Zone`,
    city: c.city,
    areas: c.areas || 4,
    slots: "8 AM – 12 PM, 12 PM – 4 PM, 4 PM – 8 PM",
    radius: c.pickupRadius || "8 km",
  }));
}
