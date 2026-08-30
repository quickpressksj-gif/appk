/** GET/POST /api/admin/partners/* — live partners & Partner 360 from the shared backend. */
import { apiGetJson, apiPostJson, apiPutJson } from "@/api/core/transport";

export type PartnerDashboardStats = {
  totalPartners: number;
  activePartners: number;
  pendingApproval: number;
  suspendedPartners: number;
  permanentlyBlocked: number;
  temporarilyDisabled: number;
  onlinePartners: number;
  offlinePartners: number;
  processingOrders: number;
  delayedOrders: number;
  newPartnersToday: number;
  newPartnersThisMonth: number;
  totalPartnerRevenue: number;
  totalPartnerEarnings: number;
  totalCommission: number;
  pendingPartnerPayout: number;
  completedSettlement: number;
  pendingSettlement: number;
  totalOrdersProcessed: number;
  totalOrdersCompleted: number;
  cancellationRate: number;
  averageProcessingTime: string;
  customerRating: number;
  complaintRate: number;
};

export type BackendPartnerItem = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  zone: string;
  serviceCategories: string[];
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  partnerEarnings: number;
  commission: number;
  rating: number;
  status: "ACTIVE" | "PENDING_APPROVAL" | "UNDER_REVIEW" | "TEMPORARILY_SUSPENDED" | "PERMANENTLY_BLOCKED" | "REJECTED" | "INACTIVE";
  kycStatus: "Verified" | "Pending" | "Rejected";
  joinedDate: string;
  lastActive: string;
  tags: string[];
  isOnline: boolean;
};

export type BackendPartnerListPage = {
  items: BackendPartnerItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminPartner = BackendPartnerItem;

export type Partner360Data = {
  header: {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    city: string;
    zone: string;
    status: string;
    kycStatus: string;
    rating: number;
    joinedDate: string;
    lastActive: string;
    tags: string[];
    activeOrdersCount: number;
  };
  overview: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    processingOrders: number;
    delayedOrders: number;
    revenue: number;
    earnings: number;
    commission: number;
    pendingPayout: number;
    aov: number;
    avgProcessingTime: string;
    rating: number;
    complaintRate: string;
    customerSatisfaction: string;
    lastOrder: string;
    lastActive: string;
  };
  orders: Array<{
    id: string;
    customer: string;
    services: string;
    amount: number;
    partnerEarnings: number;
    commission: number;
    rider: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  deliveries: {
    totalOrdersReceived: number;
    processedByPartner: number;
    pickedUpByRider: number;
    deliveredByRider: number;
    readyOrders: number;
    outForDelivery: number;
    cancelled: number;
    delayed: number;
  };
  earnings: Array<{
    id: string;
    orderCode: string;
    service: string;
    grossAmount: number;
    commission: number;
    partnerEarning: number;
    status: string;
    date: string;
  }>;
  commission: {
    currentRate: number;
    hierarchy: string;
    history: Array<{ rate: string; reason: string; admin: string; date: string }>;
  };
  wallet: {
    currentBalance: number;
    pendingEarnings: number;
    availableBalance: number;
    paidAmount: number;
    transactions: Array<{ id: string; type: string; amount: number; ref: string; date: string }>;
  };
  settlements: Array<{
    id: string;
    amount: number;
    ordersIncluded: number;
    paymentReference: string;
    date: string;
    status: string;
  }>;
  incentives: Array<{
    name: string;
    target: string;
    progress: string;
    eligibleAmount: string;
    status: string;
  }>;
  penalties: Array<{
    id: string;
    reason: string;
    amount: string;
    status: string;
    date: string;
  }>;
  services: Array<{
    name: string;
    enabled: boolean;
    orders: number;
    price: string;
  }>;
  pricing: Array<{
    service: string;
    defaultPrice: string;
    partnerPrice: string;
    override: string;
  }>;
  kyc: {
    status: string;
    gstin: string;
    pan: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    ownerVerified: boolean;
  };
  documents: Array<{
    type: string;
    number: string;
    status: string;
    date: string;
  }>;
  ratings: {
    overall: number;
    distribution: Record<string, number>;
    reviews: Array<{ customer: string; rating: number; comment: string; date: string }>;
  };
  complaints: Array<{
    id: string;
    subject: string;
    priority: string;
    status: string;
    date: string;
  }>;
  customers: {
    uniqueCustomers: number;
    repeatRate: string;
    retentionRate: string;
  };
  notifications: Array<{
    title: string;
    body: string;
    date: string;
    status: string;
  }>;
  activity: Array<{
    event: string;
    actor: string;
    at: string;
  }>;
  security: {
    lastLogin: string;
    activeSessions: number;
    device: string;
  };
  auditLogs: Array<{
    admin: string;
    action: string;
    reason: string;
    at: string;
  }>;
  internalNotes: Array<{
    id: string;
    note: string;
    author: string;
    at: string;
  }>;
};

/** GET /api/admin/partners/stats */
export async function fetchPartnerStats(): Promise<PartnerDashboardStats> {
  return apiGetJson<PartnerDashboardStats>("/api/admin/partners/stats");
}

/** GET /api/admin/partners */
export async function fetchPartners(page = 1, pageSize = 100, q?: string, status?: string, city?: string): Promise<AdminPartner[]> {
  let url = `/api/admin/partners?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (status && status !== "all") url += `&status=${encodeURIComponent(status)}`;
  if (city && city !== "all") url += `&city=${encodeURIComponent(city)}`;

  const res = await apiGetJson<BackendPartnerListPage>(url);
  return res.items || [];
}

/** GET /api/admin/partners/{id}/360 */
export async function fetchPartner360(id: string): Promise<Partner360Data> {
  return apiGetJson<Partner360Data>(`/api/admin/partners/${encodeURIComponent(id)}/360`);
}

/** POST /api/admin/partners/{id}/approve */
export async function approvePartner(id: string) {
  return apiPostJson<{ ok: boolean; status: string }>(`/api/admin/partners/${encodeURIComponent(id)}/approve`);
}

/** POST /api/admin/partners/{id}/suspend */
export async function suspendPartner(id: string, payload: { reason: string; startDate?: string; endDate?: string; internalNote?: string }) {
  return apiPostJson<{ ok: boolean; status: string; activeOrdersCount: number }>(`/api/admin/partners/${encodeURIComponent(id)}/suspend`, payload);
}

/** POST /api/admin/partners/{id}/block */
export async function blockPartner(id: string, payload: { reason: string; internalNote?: string }) {
  return apiPostJson<{ ok: boolean; status: string; activeOrdersCount: number }>(`/api/admin/partners/${encodeURIComponent(id)}/block`, payload);
}

/** POST /api/admin/partners/{id}/unblock */
export async function unblockPartner(id: string, reason = "Admin unblocked partner") {
  return apiPostJson<{ ok: boolean; status: string }>(`/api/admin/partners/${encodeURIComponent(id)}/unblock`, { reason });
}

/** POST /api/admin/partners/{id}/kyc */
export async function updatePartnerKyc(id: string, payload: { status: string; reason?: string }) {
  return apiPostJson<{ ok: boolean; kycStatus: string }>(`/api/admin/partners/${encodeURIComponent(id)}/kyc`, payload);
}

/** POST /api/admin/partners/{id}/commission */
export async function updatePartnerCommission(id: string, payload: { commissionRate: number; serviceRates?: Record<string, number> }) {
  return apiPostJson<{ ok: boolean; commissionRate: number }>(`/api/admin/partners/${encodeURIComponent(id)}/commission`, payload);
}

/** POST /api/admin/partners/{id}/wallet/adjust */
export async function adjustPartnerWallet(id: string, payload: { amount: number; type?: "credit" | "debit"; reason: string }) {
  return apiPostJson<{ ok: boolean; newBalance: number }>(`/api/admin/partners/${encodeURIComponent(id)}/wallet/adjust`, payload);
}

/** POST /api/admin/partners/{id}/notes */
export async function addPartnerNote(id: string, note: string) {
  return apiPostJson<{ id: string; note: string; author: string; at: string }>(`/api/admin/partners/${encodeURIComponent(id)}/notes`, { note });
}

/** POST /api/admin/partners/{id}/tags */
export async function updatePartnerTags(id: string, tags: string[]) {
  return apiPostJson<{ ok: boolean; tags: string[] }>(`/api/admin/partners/${encodeURIComponent(id)}/tags`, { tags });
}

/** POST /api/admin/partners/{id}/notify */
export async function sendPartnerNotification(id: string, payload: { title: string; body: string }) {
  return apiPostJson<{ ok: boolean; sent: boolean }>(`/api/admin/partners/${encodeURIComponent(id)}/notify`, payload);
}

export async function setPartnerStatus(id: string, action: "approve" | "reject" | "suspend" | "activate") {
  if (action === "suspend") {
    return suspendPartner(id, { reason: "Admin quick suspension action" });
  }
  if (action === "approve" || action === "activate") {
    return approvePartner(id);
  }
  return blockPartner(id, { reason: "Admin quick rejection action" });
}

/** POST /api/admin/partners */
export async function createPartner(payload: {
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  city: string;
  zone?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  commissionRate?: number;
}) {
  return apiPostJson<AdminPartner>("/api/admin/partners", payload);
}

export async function updatePartner(id: string, payload: Record<string, unknown>) {
  return apiPutJson<Record<string, unknown>>(`/api/admin/partners/${encodeURIComponent(id)}`, payload);
}

export async function fetchPartner(id: string) {
  return fetchPartner360(id);
}

