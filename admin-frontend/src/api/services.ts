/**
 * Master Services Catalog + Multi-Partner Pricing API Client
 *
 * GET /api/admin/services               -> Master platform catalog
 * GET /api/admin/services/categories    -> Service categories
 * GET /api/admin/partner-services       -> Partner-specific rate cards
 * PATCH /api/admin/partner-services/{id}/status -> Partner service governance
 * POST/PUT/DELETE /api/admin/services   -> Master service management
 */
import { apiGetJson, apiPostJson, apiPutJson, apiPatchJson, apiDeleteJson } from "@/api/core/transport";

export type LaundryService = {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  unit: string;
  price: number;
  description: string;
  image: string;
  sla: string;
  cities: number;
  ordersPerWeek: number;
  status: "Active" | "Inactive" | "Archived";
};

export type ServiceCategory = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  services: number;
  status: "Active" | "Inactive";
};

export type PartnerServiceRow = {
  id: string;
  partnerId: string;
  partnerName: string;
  city: string;
  masterServiceId: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  turnaroundHours: number;
  expressAvailable: boolean;
  minQuantity: number;
  status: "Active" | "Disabled" | "Suspended";
  enabled: boolean;
  ordersCount: number;
  revenue: number;
  updatedAt: string;
};

type BackendService = {
  _id: string;
  name: string;
  categoryId: string;
  unit?: string;
  price?: number;
  image?: string;
  description?: string;
  status?: string;
  turnaroundHours?: number;
};

type BackendCategory = {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  status?: string;
};

export async function fetchServices(): Promise<LaundryService[]> {
  const [services, categories] = await Promise.all([
    apiGetJson<BackendService[]>("/api/admin/services"),
    apiGetJson<BackendCategory[]>("/api/admin/services/categories"),
  ]);
  const categoryName = new Map(categories.map((c) => [c._id, c.name]));
  return services.map((s) => ({
    id: s._id,
    name: s.name,
    category: categoryName.get(s.categoryId) ?? "Laundry",
    categoryId: s.categoryId,
    unit: s.unit || "kg",
    price: s.price || 0,
    description: s.description || "",
    image: s.image || "",
    sla: s.turnaroundHours ? `${s.turnaroundHours} hrs` : "24-48 hrs",
    cities: 1,
    ordersPerWeek: 0,
    status: (s.status as any) || "Active",
  }));
}

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const [services, categories] = await Promise.all([
    apiGetJson<BackendService[]>("/api/admin/services"),
    apiGetJson<BackendCategory[]>("/api/admin/services/categories"),
  ]);
  const countByCategory = new Map<string, number>();
  for (const s of services) {
    countByCategory.set(s.categoryId, (countByCategory.get(s.categoryId) ?? 0) + 1);
  }
  return categories.map((c) => ({
    id: c._id,
    name: c.name,
    description: c.description || "",
    icon: c.icon || "Sparkles",
    services: countByCategory.get(c._id) ?? 0,
    status: (c.status as any) || "Active",
  }));
}

export async function fetchPartnerServices(params?: { partnerId?: string; city?: string }): Promise<PartnerServiceRow[]> {
  const q = new URLSearchParams();
  if (params?.partnerId) q.set("partnerId", params.partnerId);
  if (params?.city && params.city !== "all") q.set("city", params.city);
  const endpoint = `/api/admin/partner-services${q.toString() ? `?${q.toString()}` : ""}`;
  return await apiGetJson<PartnerServiceRow[]>(endpoint);
}

export async function togglePartnerServiceStatus(serviceId: string, action: "activate" | "suspend" | "disable" | "enable") {
  return await apiPatchJson<any>(`/api/admin/partner-services/${serviceId}/status`, { action });
}

export async function createService(payload: {
  name: string;
  category: string;
  price?: number;
  unit?: string;
  description?: string;
  image?: string;
}) {
  return await apiPostJson<BackendService>("/api/admin/services", {
    name: payload.name,
    categoryId: payload.category,
    price: payload.price || 0,
    unit: payload.unit || "kg",
    description: payload.description || "",
    image: payload.image || "",
    status: "Active",
  });
}

export async function updateService(
  id: string,
  payload: Partial<{ name: string; categoryId: string; price: number; unit: string; description: string; status: string }>,
) {
  return await apiPutJson<BackendService>(`/api/admin/services/${id}`, payload);
}

export async function deleteService(id: string): Promise<{ ok: boolean }> {
  return await apiDeleteJson<{ ok: boolean }>(`/api/admin/services/${id}`);
}

export async function createCategory(payload: { name: string; description?: string }) {
  return await apiPostJson<BackendCategory>("/api/admin/services/categories", payload);
}
