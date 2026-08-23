/** GET/POST /api/admin/partners/* — live partners from the shared backend. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

type BackendPartner = {
  id?: string;
  _id?: string;
  partnerId?: string;
  name?: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  city?: string;
  area?: string;
  address?: string;
  pincode?: string;
  rating?: number;
  totalOrders?: number;
  status?: "active" | "pending" | "pending_verification" | "suspended" | "rejected";
  isVerified?: boolean;
  pan?: string;
  aadhaar?: string;
  gstin?: string;
  experience?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  logo?: string;
  banner?: string;
  gallery?: string[];
  openingTime?: string;
  closingTime?: string;
  weeklyOff?: string;
  services?: { name: string; unit?: string; price?: number; enabled?: boolean }[];
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
  raw?: BackendPartner;
};

function toAdminPartner(row: BackendPartner): AdminPartner {
  const storeId = row.id || row._id || row.partnerId || "PRT-UNKNOWN";
  const storeName = row.businessName || row.name || "Partner Laundry Store";
  const owner = row.ownerName || "Authorized Partner";
  const phone = row.phone || row.mobile || "—";
  const city = row.city || "—";
  const isVerified = Boolean(row.isVerified || row.status === "active");

  const servicesStr = Array.isArray(row.services) && row.services.length > 0
    ? row.services.map((s) => s.name).join(", ")
    : "Standard Laundry Services";

  let status: AdminPartner["status"] = "Pending";
  if (row.status === "active" && isVerified) {
    status = "Active";
  } else if (row.status === "suspended") {
    status = "Suspended";
  } else {
    status = "Pending";
  }

  let kyc: AdminPartner["kyc"] = "Pending";
  if (isVerified) {
    kyc = "Verified";
  } else if (row.status === "rejected") {
    kyc = "Rejected";
  }

  return {
    id: storeId,
    store: storeName,
    owner,
    phone,
    city,
    services: servicesStr,
    rating: (row.rating ?? 5.0).toFixed(1),
    orders: row.totalOrders ?? 0,
    wallet: "—",
    kyc,
    status,
    raw: row,
  };
}

/** GET /api/admin/partners — pulls every page so console-side search/filter still works. */
export async function fetchPartners(): Promise<AdminPartner[]> {
  const first = await apiGetJson<BackendPartnerPage>("/api/admin/partners?page=1&pageSize=100");
  let items = first.items || [];
  const pages = Math.ceil((first.total || 0) / (first.pageSize || 100));
  for (let page = 2; page <= pages; page += 1) {
    const next = await apiGetJson<BackendPartnerPage>(`/api/admin/partners?page=${page}&pageSize=100`);
    if (next.items) items = items.concat(next.items);
  }
  return items.map(toAdminPartner);
}

export type PartnerDetail = AdminPartner & {
  gstin: string;
  pan: string;
  aadhaar: string;
  address: string;
  email: string;
  experience: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  openingTime: string;
  closingTime: string;
  weeklyOff: string;
  logo?: string;
  banner?: string;
  gallery: string[];
  documents: { name: string; status: "Verified" | "Pending" | "Rejected"; value?: string }[];
  pricing: { item: string; service: string; price: string }[];
  reviews: { customer: string; rating: string; note: string }[];
};

/** GET /api/admin/partners/{id} */
export async function fetchPartner(id: string): Promise<PartnerDetail> {
  const row = await apiGetJson<BackendPartner>(`/api/admin/partners/${encodeURIComponent(id)}`);
  const base = toAdminPartner(row);

  const docs: { name: string; status: "Verified" | "Pending" | "Rejected"; value?: string }[] = [];
  if (row.pan) {
    docs.push({ name: `PAN: ${row.pan}`, status: base.kyc, value: row.pan });
  }
  if (row.aadhaar) {
    docs.push({ name: `Aadhaar: ${row.aadhaar}`, status: base.kyc, value: row.aadhaar });
  }
  if (row.gstin) {
    docs.push({ name: `GSTIN: ${row.gstin}`, status: base.kyc, value: row.gstin });
  }
  if (row.logo) {
    docs.push({ name: "Store Logo Image", status: "Verified" });
  }
  if (row.banner) {
    docs.push({ name: "Store Signboard Banner", status: "Verified" });
  }

  return {
    ...base,
    gstin: row.gstin || "—",
    pan: row.pan || "—",
    aadhaar: row.aadhaar || "—",
    email: row.email || "—",
    experience: row.experience || "1 - 3 years",
    address: row.address || (row.area ? `${row.area}, ${row.city}` : row.city || "—"),
    bankName: row.bankName || "—",
    accountHolder: row.accountHolder || row.ownerName || "—",
    accountNumber: row.accountNumber || "—",
    ifsc: row.ifsc || "—",
    openingTime: row.openingTime || "08:00",
    closingTime: row.closingTime || "21:00",
    weeklyOff: row.weeklyOff || "None",
    logo: row.logo,
    banner: row.banner,
    gallery: row.gallery || [],
    documents: docs,
    pricing: (row.services ?? []).map((service) => ({
      item: service.name,
      service: service.name,
      price: service.price ? `₹${service.price.toLocaleString("en-IN")} ${service.unit || "item"}` : "Configured",
    })),
    reviews: [],
  };
}

/** POST /api/admin/partners/{id}/approve|reject|suspend|activate */
export async function setPartnerStatus(id: string, action: "approve" | "reject" | "suspend" | "activate") {
  return apiPostJson<{ id: string; status: string } | null>(`/api/admin/partners/${encodeURIComponent(id)}/${action}`);
}

/** PUT /api/admin/partners/{id} — edit partner store, bank, and KYC details */
export async function updatePartner(id: string, payload: Record<string, unknown>) {
  return apiPutJson<Record<string, unknown>>(`/api/admin/partners/${encodeURIComponent(id)}`, payload);
}

