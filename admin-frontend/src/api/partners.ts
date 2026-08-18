/** GET/POST /api/admin/partners/* — live partners from the shared backend. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

type BackendPartner = {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  city: string;
  area: string;
  rating: number;
  totalOrders: number;
  status: "active" | "pending" | "suspended";
  services: { name: string; unit: string; price: number; enabled: boolean }[];
};

type BackendPartnerPage = { items: BackendPartner[]; total: number; page: number; pageSize: number };

export type AdminPartner = {
  id: string;
  store: string;
  owner: string;
  phone: string;
  city: string;
  services: string;
  rating: string;
  orders: number;
  wallet: string;
  kyc: "Verified" | "Pending" | "Rejected";
  status: "Active" | "Pending" | "Suspended";
};

function toAdminPartner(row: BackendPartner): AdminPartner {
  return {
    id: row.id,
    store: row.name,
    owner: row.ownerName,
    phone: row.phone,
    city: row.city,
    services: (row.services ?? [])
      .filter((service) => service.enabled)
      .map((service) => service.name)
      .join(", "),
    rating: row.rating.toFixed(1),
    orders: row.totalOrders,
    wallet: "—",
    kyc: row.status === "active" ? ("Verified" as const) : ("Pending" as const),
    status:
      row.status === "active"
        ? ("Active" as const)
        : row.status === "suspended"
          ? ("Suspended" as const)
          : ("Pending" as const),
  };
}

/** GET /api/admin/partners — pulls every page so console-side search/filter still works. */
export async function fetchPartners(): Promise<AdminPartner[]> {
  const first = await apiGetJson<BackendPartnerPage>("/api/admin/partners?page=1&pageSize=100");
  let items = first.items;
  const pages = Math.ceil(first.total / first.pageSize);
  for (let page = 2; page <= pages; page += 1) {
    const next = await apiGetJson<BackendPartnerPage>(`/api/admin/partners?page=${page}&pageSize=100`);
    items = items.concat(next.items);
  }
  return items.map(toAdminPartner);
}

export type PartnerDetail = AdminPartner & {
  gstin: string;
  address: string;
  documents: { name: string; status: "Verified" | "Pending" | "Rejected" }[];
  pricing: { item: string; service: string; price: string }[];
  reviews: { customer: string; rating: string; note: string }[];
};

/** GET /api/admin/partners/{id} */
export async function fetchPartner(id: string): Promise<PartnerDetail> {
  const row = await apiGetJson<BackendPartner>(`/api/admin/partners/${id}`);
  return {
    ...toAdminPartner(row),
    gstin: "—",
    address: row.area ? `${row.area}, ${row.city}` : row.city,
    documents: [],
    pricing: (row.services ?? []).map((service) => ({
      item: service.name,
      service: service.name,
      price: `₹${service.price.toLocaleString("en-IN")} ${service.unit}`,
    })),
    reviews: [],
  };
}

/** POST /api/admin/partners/{id}/approve|reject|suspend|activate */
export async function setPartnerStatus(id: string, action: "approve" | "reject" | "suspend" | "activate") {
  return apiPostJson<{ id: string; status: string } | null>(`/api/admin/partners/${id}/${action}`);
}
