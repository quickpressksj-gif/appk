// Partner services (rate card) data layer — backed by the shared mock/live backend.
import { apiGetJson, apiPostJson, apiRequest } from "../core/transport";
import type { BusinessCategory, PartnerServiceRate } from "@shared/types/partner";

export type RawService = {
  id: string;
  name: string;
  unit: string;
  price: number;
  enabled: boolean;
  turnaroundHours?: number;
  category?: BusinessCategory;
};

export type ServiceWritePayload = {
  name: string;
  unit: string;
  price: number;
  turnaroundHours?: number;
  enabled?: boolean;
  category?: BusinessCategory;
};

function toServiceRate(raw: RawService): PartnerServiceRate {
  return {
    id: raw.id,
    name: raw.name,
    unit: raw.unit,
    price: raw.price,
    enabled: raw.enabled,
    turnaroundHours: raw.turnaroundHours ?? 24,
    category: raw.category ?? "laundry",
  };
}

export async function fetchPartnerServices(): Promise<PartnerServiceRate[]> {
  const services = await apiGetJson<RawService[]>("/api/partner/services");
  return services.map(toServiceRate);
}

export async function createPartnerService(payload: ServiceWritePayload): Promise<PartnerServiceRate> {
  const raw = await apiPostJson<RawService>("/api/partner/services", payload);
  return toServiceRate(raw);
}

export async function updatePartnerService(
  serviceId: string,
  payload: Partial<ServiceWritePayload>,
): Promise<PartnerServiceRate> {
  const raw = await apiRequest<RawService>("PUT", `/api/partner/services/${serviceId}`, { body: payload });
  return toServiceRate(raw);
}

export async function deletePartnerService(serviceId: string): Promise<void> {
  await apiRequest<void>("DELETE", `/api/partner/services/${serviceId}`);
}

export async function toggleService(serviceId: string, enabled: boolean) {
  const raw = await apiRequest<RawService>("PUT", `/api/partner/services/${serviceId}/toggle`, {
    params: { enabled },
  });
  return { ok: true as const, serviceId, enabled: raw.enabled };
}

export async function updateServicePrice(serviceId: string, price: number) {
  await apiRequest("PUT", `/api/partner/services/${serviceId}`, { body: { price } });
  return { ok: true as const, serviceId, price };
}
