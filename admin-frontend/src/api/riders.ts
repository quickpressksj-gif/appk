/** GET/POST /api/admin/riders/* — live riders from the shared backend. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

type BackendRider = {
  id: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  plate: string;
  rating: number;
  trips: number;
  isOnline: boolean;
  status: "active" | "pending" | "suspended";
};

type BackendRiderPage = { items: BackendRider[]; total: number; page: number; pageSize: number };

export type AdminRider = {
  id: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  plate: string;
  trips: number;
  rating: string;
  wallet: string;
  live: "Online" | "Offline" | "On delivery";
  status: "Active" | "Pending" | "Suspended";
};

function toAdminRider(row: BackendRider): AdminRider {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    city: row.city,
    vehicle: row.vehicle,
    plate: row.plate,
    trips: row.trips,
    rating: row.rating.toFixed(1),
    wallet: "—",
    live: row.isOnline ? ("Online" as const) : ("Offline" as const),
    status:
      row.status === "active"
        ? ("Active" as const)
        : row.status === "suspended"
          ? ("Suspended" as const)
          : ("Pending" as const),
  };
}

/** GET /api/admin/riders — pulls every page so console-side search/filter still works. */
export async function fetchRiders(): Promise<AdminRider[]> {
  const first = await apiGetJson<BackendRiderPage>("/api/admin/riders?page=1&pageSize=100");
  let items = first.items;
  const pages = Math.ceil(first.total / first.pageSize);
  for (let page = 2; page <= pages; page += 1) {
    const next = await apiGetJson<BackendRiderPage>(`/api/admin/riders?page=${page}&pageSize=100`);
    items = items.concat(next.items);
  }
  return items.map(toAdminRider);
}

export type RiderDetail = AdminRider & {
  documents: { name: string; status: "Verified" | "Pending" | "Rejected" }[];
  assignedOrders: { id: string; customer: string; status: string; eta: string }[];
  earnings: { id: string; label: string; amount: string; date: string }[];
};

/** GET /api/admin/riders/{id} */
export async function fetchRider(id: string): Promise<RiderDetail> {
  const row = await apiGetJson<BackendRider>(`/api/admin/riders/${id}`);
  return {
    ...toAdminRider(row),
    documents: [],
    assignedOrders: [],
    earnings: [],
  };
}

/** POST /api/admin/riders/{id}/approve|reject|suspend|activate */
export async function setRiderStatus(id: string, action: "approve" | "reject" | "suspend" | "activate") {
  return apiPostJson<{ id: string; status: string } | null>(`/api/admin/riders/${id}/${action}`);
}
