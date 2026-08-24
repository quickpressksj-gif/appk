// Partner services (rate card) data layer — backed by the shared mock/live backend.
import { apiGetJson, apiPostJson, apiRequest } from "../core/transport";
import type { BusinessCategory, PartnerServiceRate } from "@/shared/types/partner";

export type RawService = {
  id: string;
  name: string;
  unit: string;
  price: number;
  enabled?: boolean;
  isActive?: boolean;
  turnaroundHours?: number;
  category?: string;
  description?: string;
  image?: string;
  minQuantity?: number;
  expressAvailable?: boolean;
};

export type ServiceWritePayload = {
  name: string;
  unit: string;
  price: number;
  turnaroundHours?: number;
  enabled?: boolean;
  category?: string;
  description?: string;
  image?: string;
  minQuantity?: number;
  expressAvailable?: boolean;
};

function toServiceRate(raw: RawService): PartnerServiceRate {
  const isEnabled = raw.enabled !== undefined ? raw.enabled : (raw.isActive !== undefined ? raw.isActive : true);
  return {
    id: String(raw.id),
    name: raw.name || "Laundry Service",
    unit: raw.unit || "kg",
    price: Number(raw.price || 0),
    enabled: Boolean(isEnabled),
    turnaroundHours: Number(raw.turnaroundHours || 24),
    category: (raw.category as BusinessCategory) || "laundry",
    description: raw.description || "",
    image: raw.image || "",
  };
}

export async function fetchPartnerServices(): Promise<PartnerServiceRate[]> {
  const services = await apiGetJson<RawService[]>("/api/partner/services");
  return (services || []).map(toServiceRate);
}

export async function createPartnerService(payload: ServiceWritePayload): Promise<PartnerServiceRate> {
  const raw = await apiPostJson<RawService>("/api/partner/services", payload);
  return toServiceRate(raw);
}

export async function updatePartnerService(
  serviceId: string,
  payload: Partial<ServiceWritePayload>,
): Promise<PartnerServiceRate> {
  const raw = await apiRequest<RawService>("PUT", `/api/partner/services/${encodeURIComponent(serviceId)}`, { body: payload });
  return toServiceRate(raw);
}

export async function deletePartnerService(serviceId: string): Promise<void> {
  await apiRequest<void>("DELETE", `/api/partner/services/${encodeURIComponent(serviceId)}`);
}

export async function toggleService(serviceId: string, enabled: boolean) {
  const raw = await apiRequest<RawService>("PUT", `/api/partner/services/${encodeURIComponent(serviceId)}/toggle`, {
    params: { enabled },
  });
  return { ok: true as const, serviceId, enabled: raw?.enabled ?? enabled };
}

export async function updateServicePrice(serviceId: string, price: number) {
  await apiRequest("PUT", `/api/partner/services/${encodeURIComponent(serviceId)}`, { body: { price } });
  return { ok: true as const, serviceId, price };
}
