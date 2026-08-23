/** GET/POST/PUT /api/admin/riders/* — live riders from the shared backend. */
import { apiGetJson, apiPostJson, apiPutJson } from "@/api/core/transport";

type BackendRider = {
  id?: string;
  _id?: string;
  riderId?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  city?: string;
  vehicle?: string;
  vehicleType?: string;
  plate?: string;
  vehicleNumber?: string;
  rating?: number;
  trips?: number;
  totalTrips?: number;
  isOnline?: boolean;
  onlineMinutes?: number;
  status?: "active" | "pending" | "suspended" | "rejected";
  kycStatus?: "verified" | "pending" | "rejected";
  bankName?: string;
  accountLast4?: string;
  ifsc?: string;
  joinedOn?: string;
  documents?: { id?: string; name?: string; label?: string; status: "Verified" | "Pending" | "Rejected" | "verified" | "pending" | "rejected" }[];
};

type BackendRiderPage = { items: BackendRider[]; total: number; page: number; pageSize: number };

export type AdminRider = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  vehicle: string;
  plate: string;
  trips: number;
  rating: string;
  wallet: string;
  bankName: string;
  accountLast4: string;
  ifsc: string;
  joinedOn: string;
  kyc: "Verified" | "Pending" | "Rejected";
  live: "Online" | "Offline" | "On delivery";
  status: "Active" | "Pending" | "Suspended";
  raw?: BackendRider;
};

function toAdminRider(row: BackendRider): AdminRider {
  const riderId = row.id || row._id || row.riderId || "RDR-UNKNOWN";
  const name = row.name || row.fullName || "Delivery Partner";
  const phone = row.phone || row.mobile || "—";
  const email = row.email || "—";
  const city = row.city || "—";
  const vehicle = row.vehicle || row.vehicleType || "Motorbike";
  const plate = row.plate || row.vehicleNumber || "—";
  const trips = row.trips ?? row.totalTrips ?? 0;
  const rating = (row.rating ?? 5.0).toFixed(1);
  const isOnline = Boolean(row.isOnline);

  let status: AdminRider["status"] = "Pending";
  if (row.status === "active" || row.kycStatus === "verified") {
    status = "Active";
  } else if (row.status === "suspended") {
    status = "Suspended";
  } else {
    status = "Pending";
  }

  let kyc: AdminRider["kyc"] = "Pending";
  if (row.kycStatus === "verified" || row.status === "active") {
    kyc = "Verified";
  } else if (row.kycStatus === "rejected" || row.status === "rejected") {
    kyc = "Rejected";
  }

  return {
    id: riderId,
    name,
    phone,
    email,
    city,
    vehicle,
    plate,
    trips,
    rating,
    wallet: "—",
    bankName: row.bankName || "—",
    accountLast4: row.accountLast4 || "—",
    ifsc: row.ifsc || "—",
    joinedOn: row.joinedOn || "—",
    kyc,
    live: isOnline ? ("Online" as const) : ("Offline" as const),
    status,
    raw: row,
  };
}

/** GET /api/admin/riders — pulls every page so console-side search/filter still works. */
export async function fetchRiders(): Promise<AdminRider[]> {
  const first = await apiGetJson<BackendRiderPage>("/api/admin/riders?page=1&pageSize=100");
  let items = first.items || [];
  const pages = Math.ceil((first.total || 0) / (first.pageSize || 100));
  for (let page = 2; page <= pages; page += 1) {
    const next = await apiGetJson<BackendRiderPage>(`/api/admin/riders?page=${page}&pageSize=100`);
    if (next.items) items = items.concat(next.items);
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
  const row = await apiGetJson<BackendRider>(`/api/admin/riders/${encodeURIComponent(id)}`);
  const base = toAdminRider(row);

  const rawDocs = row.documents || [];
  const docs = rawDocs.length > 0
    ? rawDocs.map((d) => ({
        name: d.name || d.label || "Document",
        status: (d.status?.toLowerCase() === "verified" ? "Verified" : d.status?.toLowerCase() === "rejected" ? "Rejected" : "Pending") as "Verified" | "Pending" | "Rejected",
      }))
    : [
        { name: `Driving License: ${base.plate || "Provided"}`, status: base.kyc },
        { name: `Vehicle RC (${base.vehicle})`, status: base.kyc },
        { name: "Aadhaar Card", status: base.kyc },
      ];

  return {
    ...base,
    documents: docs,
    assignedOrders: [],
    earnings: [],
  };
}

/** POST /api/admin/riders/{id}/approve|reject|suspend|activate */
export async function setRiderStatus(id: string, action: "approve" | "reject" | "suspend" | "activate") {
  return apiPostJson<{ id: string; status: string } | null>(`/api/admin/riders/${encodeURIComponent(id)}/${action}`);
}

/** PUT /api/admin/riders/{id} — edit rider profile, vehicle, and bank details */
export async function updateRider(id: string, payload: Record<string, unknown>) {
  return apiPutJson<Record<string, unknown>>(`/api/admin/riders/${encodeURIComponent(id)}`, payload);
}
