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

export type CustomerDetail = AdminCustomer & {
  addresses: { label: string; line: string }[];
  recentOrders: { id: string; service: string; status: string; total: string; date: string }[];
  walletLedger: { id: string; label: string; amount: string; date: string }[];
};

/** GET /api/admin/customers/{id} */
export async function fetchCustomer(id: string): Promise<CustomerDetail> {
  const row = await apiGetJson<BackendCustomer>(`/api/admin/customers/${id}`);
  return {
    ...toAdminCustomer(row),
    addresses: [],
    recentOrders: [],
    walletLedger: [],
  };
}

/** POST /api/admin/customers/{id}/block or /unblock */
export async function setCustomerBlocked(id: string, blocked: boolean) {
  const result = await apiPostJson<{ ok: boolean; id: string; blocked: boolean }>(
    `/api/admin/customers/${id}/${blocked ? "block" : "unblock"}`,
  );
  return result;
}
