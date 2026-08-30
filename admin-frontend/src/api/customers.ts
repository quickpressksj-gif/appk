/** GET/POST /api/admin/customers/* — live customers from the shared backend. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

type BackendCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  orders: number;
  spend: number;
  status: string;
};

type BackendCustomerPage = {
  items: BackendCustomer[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  orders: number;
  spend: string;
  wallet: string;
  joined: string;
  status: "Active" | "Blocked";
};

function toAdminCustomer(row: BackendCustomer): AdminCustomer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    orders: row.orders,
    spend: `₹${row.spend.toLocaleString("en-IN")}`,
    wallet: "—",
    joined: "—",
    status: row.status === "blocked" ? ("Blocked" as const) : ("Active" as const),
  };
}

/** GET /api/admin/customers — pulls every page so console-side search/filter still works. */
export async function fetchCustomers(): Promise<AdminCustomer[]> {
  const first = await apiGetJson<BackendCustomerPage>("/api/admin/customers?page=1&pageSize=100");
  let items = first.items;
  const pages = Math.ceil(first.total / first.pageSize);
  for (let page = 2; page <= pages; page += 1) {
    const next = await apiGetJson<BackendCustomerPage>(`/api/admin/customers?page=${page}&pageSize=100`);
    items = items.concat(next.items);
  }
  return items.map(toAdminCustomer);
}

export type CustomerStats = {
  totalCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  newCustomersToday: number;
  newCustomersThisWeek: number;
  newCustomersThisMonth: number;
  repeatCustomers: number;
  inactiveCustomers: number;
  vipCustomers: number;
  membershipCustomers: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
};

export type Customer360Data = {
  profile: any;
  overview: {
    firstOrder: string;
    lastOrder: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    favoriteService: string;
    favoritePartner: string;
    clv: number;
    walletBalance: number;
    loyaltyPoints: number;
    loyaltyLevel: string;
    membership: string;
    referralCode: string;
    referralEarnings: number;
  };
  orders: any[];
  wallet: {
    balance: number;
    totalCashback: number;
    totalRefund: number;
    referralRewards: number;
    ledger: any[];
  };
  loyalty: {
    points: number;
    availablePoints: number;
    level: string;
    nextLevel: string;
    progressPercent: number;
  };
  membership: {
    plan: string;
    startDate: string;
    expiryDate: string;
    status: string;
    benefits: string[];
  };
  addresses: any[];
  support: any[];
  notes: { id: string; note: string; author: string; at: string }[];
  tags: string[];
  activity: { date: string; event: string; source: string; icon: string }[];
  security: {
    status: string;
    registrationDate: string;
    activeSessions: number;
    loginHistory: any[];
  };
};

/** GET /api/admin/customers/stats */
export async function fetchCustomerStats(): Promise<CustomerStats> {
  return await apiGetJson<CustomerStats>("/api/admin/customers/stats");
}

/** GET /api/admin/customers/{id}/360 */
export async function fetchCustomer360(id: string): Promise<Customer360Data> {
  return await apiGetJson<Customer360Data>(`/api/admin/customers/${id}/360`);
}

/** POST /api/admin/customers/{id}/wallet/adjust */
export async function adjustCustomerWallet(id: string, amount: number, reason: string) {
  return await apiPostJson<{ ok: boolean; newBalance: number }>(`/api/admin/customers/${id}/wallet/adjust`, { amount, reason });
}

/** POST /api/admin/customers/{id}/loyalty/adjust */
export async function adjustCustomerLoyalty(id: string, points: number, reason: string) {
  return await apiPostJson<{ ok: boolean; newPoints: number }>(`/api/admin/customers/${id}/loyalty/adjust`, { points, reason });
}


/** POST /api/admin/customers/{id}/notes */
export async function addCustomerNote(id: string, note: string) {
  return await apiPostJson<{ id: string; note: string; author: string; at: string }>(`/api/admin/customers/${id}/notes`, { note });
}

/** POST /api/admin/customers/{id}/tags */
export async function updateCustomerTags(id: string, tags: string[]) {
  return await apiPostJson<{ ok: boolean; tags: string[] }>(`/api/admin/customers/${id}/tags`, { tags });
}

/** POST /api/admin/customers/{id}/send-notification */
export async function sendCustomerNotification(id: string, title: string, body: string) {
  return await apiPostJson<{ ok: boolean; sent: boolean }>(`/api/admin/customers/${id}/send-notification`, { title, body });
}

/** POST /api/admin/customers/{id}/logout-sessions */
export async function logoutCustomerSessions(id: string) {
  return await apiPostJson<{ ok: boolean; invalidated: boolean }>(`/api/admin/customers/${id}/logout-sessions`, {});
}

/** POST /api/admin/customers/{id}/block or /unblock */
export async function setCustomerBlocked(id: string, blocked: boolean) {
  return await apiPostJson<{ ok: boolean; id: string; blocked: boolean }>(
    `/api/admin/customers/${id}/${blocked ? "block" : "unblock"}`,
  );
}


