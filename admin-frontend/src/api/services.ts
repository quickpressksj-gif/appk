/** GET/POST/PUT /api/admin/services — real catalogue, categories and pricing. Delete has no backend endpoint. */
import { apiGetJson, apiPostJson, apiPutJson } from "@/api/core/transport";

export type LaundryService = {
  id: string;
  name: string;
  category: string;
  sla: string;
  cities: number;
  ordersPerWeek: number;
  status: "Active";
};

export type ServiceCategory = { id: string; name: string; services: number; status: "Active" };

export type ServicePrice = {
  id: string;
  item: string;
  service: string;
  city: string;
  price: string;
  commission: string;
};

type BackendService = {
  _id: string;
  name: string;
  categoryId: string;
  unit: string;
  price: number;
  image: string;
  description: string;
};

type BackendCategory = { _id: string; name: string };

type BackendPrice = { id: string; item: string; service: string; city: string; price: number; commission: string };

export async function fetchServices(): Promise<LaundryService[]> {
  const [services, categories] = await Promise.all([
    apiGetJson<BackendService[]>("/api/admin/services"),
    apiGetJson<BackendCategory[]>("/api/admin/services/categories"),
  ]);
  const categoryName = new Map(categories.map((c) => [c._id, c.name]));
  return services.map((s) => ({
    id: s._id,
    name: s.name,
    category: categoryName.get(s.categoryId) ?? "—",
    sla: "—",
    cities: 0,
    ordersPerWeek: 0,
    status: "Active",
  }));
}

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const [services, categories] = await Promise.all([
    apiGetJson<BackendService[]>("/api/admin/services"),
    apiGetJson<BackendCategory[]>("/api/admin/services/categories"),
  ]);
  const countByCategory = new Map<string, number>();
  for (const s of services) countByCategory.set(s.categoryId, (countByCategory.get(s.categoryId) ?? 0) + 1);
  return categories.map((c) => ({
    id: c._id,
    name: c.name,
    services: countByCategory.get(c._id) ?? 0,
    status: "Active",
  }));
}

export async function fetchServicePricing(): Promise<ServicePrice[]> {
  const rows = await apiGetJson<BackendPrice[]>("/api/admin/services/pricing");
  return rows.map((r) => ({
    id: r.id,
    item: r.item,
    service: r.service,
    city: r.city || "—",
    price: typeof r.price === "number" ? `₹${r.price.toLocaleString("en-IN")}` : String(r.price ?? "—"),
    commission: r.commission || "—",
  }));
}

export function createService(payload: { name: string; category: string; price: string }) {
  return apiPostJson<BackendService>("/api/admin/services", {
    name: payload.name,
    categoryId: payload.category,
    price: Number(String(payload.price).replace(/[^\d.]/g, "")) || 0,
  });
}

export function updateService(id: string, payload: Partial<{ name: string; categoryId: string; price: number }>) {
  return apiPutJson<BackendService>(`/api/admin/services/${id}`, payload);
}

/** There is no DELETE /services endpoint on the backend — deleting is intentionally unavailable. */
export function deleteService(_id: string): Promise<never> {
  return Promise.reject(new Error("Deleting services is not available yet — no backend endpoint exists."));
}
