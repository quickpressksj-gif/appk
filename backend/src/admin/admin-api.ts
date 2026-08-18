/**
 * QuickPress Admin — data layer.
 *
 * Part of the single shared QuickPress backend package. Every admin screen
 * talks to these functions only; swap the mock resolvers for `request()` calls
 * against the same backend the customer, partner and rider apps use.
 */
import type { AuthSession } from "@shared/types";

import { delay } from "../core/admin-client";
import { apiGetJson, apiPostJson } from "../core/transport";
import { writeSession } from "../core/session-store";
import type { AdminOrderRow } from "../mock/mappers";

/** Shapes the shared backend returns for the live admin endpoints. */
type AdminDashboard = {
  totalOrders: number;
  liveOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  partners: number;
  riders: number;
  customers: number;
};

type AdminCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  orders: number;
  spend: number;
};

type AdminPartner = {
  id: string;
  name: string;
  ownerName: string;
  city: string;
  rating: number;
  status: string;
  isOpen: boolean;
};

type AdminRider = {
  id: string;
  name: string;
  city: string;
  trips: number;
  rating: number;
  isOnline: boolean;
  status: string;
};

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export type Row = Record<string, string | number>;

export type Column = { key: string; label: string };

export type Metric = { id: string; label: string; value: string; delta: string; positive: boolean };

export type TableData = { columns: Column[]; rows: Row[] };

function table(columns: Column[], rows: Row[]): Promise<TableData> {
  return delay({ columns, rows });
}

/** GET /api/admin/dashboard */
export async function fetchDashboardMetrics(): Promise<Metric[]> {
  const stats = await apiGetJson<AdminDashboard>("/api/admin/dashboard");
  return [
    {
      id: "orders",
      label: "Orders today",
      value: stats.totalOrders.toLocaleString("en-IN"),
      delta: `${stats.liveOrders} live`,
      positive: true,
    },
    { id: "gmv", label: "Gross volume", value: money(stats.revenue), delta: `${stats.deliveredOrders} delivered`, positive: true },
    { id: "riders", label: "Active riders", value: String(stats.riders), delta: `${stats.partners} partners`, positive: true },
    {
      id: "sla",
      label: "Completion rate",
      value: `${stats.totalOrders ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%`,
      delta: `${stats.cancelledOrders} cancelled`,
      positive: stats.cancelledOrders === 0,
    },
  ];
}

/** GET /api/admin/orders — latest lifecycle activity. */
export async function fetchDashboardActivity(): Promise<TableData> {
  const orders = await apiGetJson<AdminOrderRow[]>("/api/admin/orders");
  return {
    columns: [
      { key: "id", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "partner", label: "Partner" },
      { key: "status", label: "Status" },
      { key: "amount", label: "Amount" },
    ],
    rows: orders.slice(0, 8).map((order) => ({
      id: order.code,
      customer: order.customer,
      partner: order.partner,
      status: order.statusLabel,
      amount: money(order.amount),
    })),
  };
}

/** GET /api/admin/orders */
export async function fetchOrders(): Promise<TableData> {
  const orders = await apiGetJson<AdminOrderRow[]>("/api/admin/orders");
  return {
    columns: [
      { key: "id", label: "Order ID" },
      { key: "customer", label: "Customer" },
      { key: "rider", label: "Rider" },
      { key: "city", label: "City" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total" },
    ],
    rows: orders.map((order) => ({
      id: order.code,
      customer: order.customer,
      rider: order.rider,
      city: order.city,
      status: order.statusLabel,
      total: money(order.amount),
    })),
  };
}

/** POST /api/admin/orders/{id}/assign-rider */
export async function assignRiderToOrder(orderId: string, riderId: string) {
  return apiPostJson<AdminOrderRow>(`/api/admin/orders/${orderId}/assign-rider`, { riderId });
}

/** GET /api/admin/customers */
export async function fetchCustomers(): Promise<TableData> {
  const customers = await apiGetJson<AdminCustomer[]>("/api/admin/customers");
  return {
    columns: [
      { key: "name", label: "Customer" },
      { key: "phone", label: "Phone" },
      { key: "city", label: "City" },
      { key: "orders", label: "Orders" },
      { key: "spend", label: "Lifetime spend" },
    ],
    rows: customers.map((customer) => ({
      name: customer.name,
      phone: customer.phone,
      city: customer.city,
      orders: customer.orders,
      spend: money(customer.spend),
    })),
  };
}

/** GET /api/admin/partners */
export async function fetchPartners(): Promise<TableData> {
  const partners = await apiGetJson<AdminPartner[]>("/api/admin/partners");
  return {
    columns: [
      { key: "store", label: "Store" },
      { key: "owner", label: "Owner" },
      { key: "city", label: "City" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status" },
    ],
    rows: partners.map((partner) => ({
      store: partner.name,
      owner: partner.ownerName,
      city: partner.city,
      rating: partner.rating.toFixed(1),
      status: partner.isOpen ? titleCase(partner.status) : "Paused",
    })),
  };
}

/** GET /api/admin/riders */
export async function fetchRiders(): Promise<TableData> {
  const riders = await apiGetJson<AdminRider[]>("/api/admin/riders");
  return {
    columns: [
      { key: "name", label: "Rider" },
      { key: "city", label: "City" },
      { key: "trips", label: "Trips today" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status" },
    ],
    rows: riders.map((rider) => ({
      name: rider.name,
      city: rider.city,
      trips: rider.trips,
      rating: rider.rating.toFixed(1),
      status: rider.isOnline ? "Online" : "Offline",
    })),
  };
}

export function fetchCities(): Promise<TableData> {
  return table(
    [
      { key: "city", label: "City" },
      { key: "zones", label: "Zones" },
      { key: "partners", label: "Partners" },
      { key: "riders", label: "Riders" },
      { key: "status", label: "Status" },
    ],
    [
      { city: "Mumbai", zones: 18, partners: 64, riders: 210, status: "Live" },
      { city: "Pune", zones: 9, partners: 28, riders: 74, status: "Live" },
      { city: "Bengaluru", zones: 14, partners: 41, riders: 128, status: "Live" },
      { city: "Hyderabad", zones: 6, partners: 12, riders: 30, status: "Pilot" },
    ],
  );
}

export function fetchServices(): Promise<TableData> {
  return table(
    [
      { key: "service", label: "Service" },
      { key: "sla", label: "SLA" },
      { key: "cities", label: "Cities" },
      { key: "orders", label: "Orders / week" },
      { key: "status", label: "Status" },
    ],
    [
      { service: "Wash & Fold", sla: "24 hrs", cities: 4, orders: 4820, status: "Active" },
      { service: "Dry Clean", sla: "48 hrs", cities: 4, orders: 2140, status: "Active" },
      { service: "Steam Iron", sla: "12 hrs", cities: 3, orders: 3310, status: "Active" },
      { service: "Premium Care", sla: "72 hrs", cities: 2, orders: 480, status: "Beta" },
    ],
  );
}

export function fetchPricing(): Promise<TableData> {
  return table(
    [
      { key: "item", label: "Item" },
      { key: "service", label: "Service" },
      { key: "city", label: "City" },
      { key: "price", label: "Price" },
      { key: "commission", label: "Commission" },
    ],
    [
      { item: "Shirt", service: "Steam Iron", city: "Mumbai", price: "₹18", commission: "18%" },
      { item: "Trouser", service: "Wash & Fold", city: "Mumbai", price: "₹40", commission: "18%" },
      { item: "Blanket", service: "Dry Clean", city: "Pune", price: "₹320", commission: "22%" },
      { item: "Suit (2 pc)", service: "Premium Care", city: "Bengaluru", price: "₹640", commission: "25%" },
    ],
  );
}

export function fetchWallet(): Promise<TableData> {
  return table(
    [
      { key: "account", label: "Account" },
      { key: "type", label: "Type" },
      { key: "balance", label: "Balance" },
      { key: "hold", label: "On hold" },
      { key: "updated", label: "Updated" },
    ],
    [
      { account: "SpinCycle Andheri", type: "Partner", balance: "₹42,180", hold: "₹3,200", updated: "2 min ago" },
      { account: "Sameer Khan", type: "Rider", balance: "₹6,420", hold: "₹0", updated: "9 min ago" },
      { account: "Aarav Shah", type: "Customer", balance: "₹840", hold: "₹0", updated: "1 hr ago" },
      { account: "QuickPress Escrow", type: "Platform", balance: "₹12.4L", hold: "₹1.1L", updated: "just now" },
    ],
  );
}

export function fetchWithdrawRequests(): Promise<TableData> {
  return table(
    [
      { key: "id", label: "Request" },
      { key: "account", label: "Account" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status" },
    ],
    [
      { id: "WD-4412", account: "SpinCycle Andheri", type: "Partner", amount: "₹18,000", status: "Pending" },
      { id: "WD-4411", account: "Sameer Khan", type: "Rider", amount: "₹4,200", status: "Approved" },
      { id: "WD-4408", account: "FreshFold Powai", type: "Partner", amount: "₹22,500", status: "Processing" },
      { id: "WD-4402", account: "Priya Das", type: "Rider", amount: "₹3,100", status: "Rejected" },
    ],
  );
}

export function fetchNotifications(): Promise<TableData> {
  return table(
    [
      { key: "title", label: "Campaign" },
      { key: "audience", label: "Audience" },
      { key: "channel", label: "Channel" },
      { key: "sent", label: "Sent" },
      { key: "status", label: "Status" },
    ],
    [
      { title: "Monsoon 30% off", audience: "Customers · Mumbai", channel: "Push", sent: "42,100", status: "Delivered" },
      { title: "Payout cycle update", audience: "Partners", channel: "Email", sent: "1,204", status: "Delivered" },
      { title: "Weekend surge bonus", audience: "Riders", channel: "SMS", sent: "3,180", status: "Scheduled" },
      { title: "Premium Care launch", audience: "Customers · Bengaluru", channel: "Push", sent: "—", status: "Draft" },
    ],
  );
}

export function fetchAnalytics(): Promise<{ metrics: Metric[]; table: TableData }> {
  return delay({
    metrics: [
      { id: "aov", label: "Average order value", value: "₹712", delta: "+4.2%", positive: true },
      { id: "repeat", label: "Repeat rate", value: "63%", delta: "+2.1%", positive: true },
      { id: "cac", label: "Blended CAC", value: "₹184", delta: "-6.5%", positive: true },
      { id: "cancel", label: "Cancellation rate", value: "2.8%", delta: "+0.4%", positive: false },
    ],
    table: {
      columns: [
        { key: "city", label: "City" },
        { key: "orders", label: "Orders" },
        { key: "gmv", label: "GMV" },
        { key: "aov", label: "AOV" },
        { key: "growth", label: "Growth" },
      ],
      rows: [
        { city: "Mumbai", orders: 24810, gmv: "₹1.78Cr", aov: "₹718", growth: "+11%" },
        { city: "Pune", orders: 8420, gmv: "₹58.4L", aov: "₹693", growth: "+7%" },
        { city: "Bengaluru", orders: 15220, gmv: "₹1.12Cr", aov: "₹735", growth: "+18%" },
        { city: "Hyderabad", orders: 1980, gmv: "₹12.6L", aov: "₹636", growth: "+42%" },
      ],
    },
  });
}

export function fetchReports(): Promise<TableData> {
  return table(
    [
      { key: "name", label: "Report" },
      { key: "period", label: "Period" },
      { key: "format", label: "Format" },
      { key: "generated", label: "Generated" },
      { key: "status", label: "Status" },
    ],
    [
      { name: "Monthly GMV", period: "Jul 2026", format: "CSV", generated: "01 Aug 2026", status: "Ready" },
      { name: "Partner payouts", period: "Jul 2026", format: "XLSX", generated: "01 Aug 2026", status: "Ready" },
      { name: "Rider incentives", period: "Week 30", format: "CSV", generated: "28 Jul 2026", status: "Ready" },
      { name: "GST summary", period: "Q1 FY27", format: "PDF", generated: "—", status: "Queued" },
    ],
  );
}

export function fetchSupportTickets(): Promise<TableData> {
  return table(
    [
      { key: "id", label: "Ticket" },
      { key: "subject", label: "Subject" },
      { key: "raisedBy", label: "Raised by" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
    ],
    [
      { id: "TK-2201", subject: "Missing garment", raisedBy: "Aarav Shah", priority: "High", status: "Open" },
      { id: "TK-2198", subject: "Payout not received", raisedBy: "SpinCycle Andheri", priority: "High", status: "In progress" },
      { id: "TK-2190", subject: "App crash on OTP", raisedBy: "Priya Das", priority: "Medium", status: "Resolved" },
      { id: "TK-2185", subject: "Wrong pickup slot", raisedBy: "Neha Rao", priority: "Low", status: "Resolved" },
    ],
  );
}

export function fetchStaff(): Promise<TableData> {
  return table(
    [
      { key: "name", label: "Member" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "city", label: "Scope" },
      { key: "status", label: "Status" },
    ],
    [
      { name: "Meera Iyer", email: "meera@quickpress.in", role: "Super admin", city: "All cities", status: "Active" },
      { name: "Arjun Bose", email: "arjun@quickpress.in", role: "Ops manager", city: "Mumbai", status: "Active" },
      { name: "Tanvi Sheth", email: "tanvi@quickpress.in", role: "Support lead", city: "All cities", status: "Active" },
      { name: "Raghav Nanda", email: "raghav@quickpress.in", role: "Finance", city: "All cities", status: "Invited" },
    ],
  );
}

export type AdminSettings = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCommission: string;
  payoutCycle: string;
};

export function fetchSettings(): Promise<AdminSettings> {
  return delay({
    platformName: "QuickPress",
    supportEmail: "help@quickpress.in",
    supportPhone: "+91 1800 200 400",
    defaultCommission: "18%",
    payoutCycle: "Weekly · Monday",
  });
}

export function saveSettings(settings: AdminSettings): Promise<AdminSettings> {
  return delay(settings, 700);
}

/** POST /api/auth/login — mock admin sign-in (dummy credentials). */
export async function adminLogin(email: string, password = "quickpress"): Promise<{ email: string; token: string }> {
  const session = await apiPostJson<AuthSession>(
    "/api/auth/login",
    { email, password, role: "admin" },
    { anonymous: true },
  );
  writeSession(session, "admin");
  return { email: session.account.email, token: session.token };
}
