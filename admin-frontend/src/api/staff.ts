/**
 * Staff & Role-Based Access Control (RBAC) & Operations Audit Engine API Client
 *
 * GET/POST /api/admin/staff        — Team members directory & onboarding
 * PUT/DELETE /api/admin/staff/{id} — Update permissions, territory & status
 * GET /api/admin/staff/roles       — RBAC security tier matrices
 * GET /api/admin/staff/logs        — Complete immutable security audit trail
 */
import { apiGetJson, apiPostJson, apiPutJson, apiDeleteJson } from "@/api/core/transport";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  scope: string;
  permissions: string[];
  lastActive: string;
  status: "Active" | "Invited" | "Suspended";
  createdAt?: string;
};

export type StaffRole = {
  id: string;
  name: string;
  members: number;
  permissions: string[];
};

export type ActivityLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  meta?: Record<string, any>;
};

type BackendStaff = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  scope?: string;
  permissions?: string[];
  lastActive?: string;
  status?: string;
  createdAt?: string;
};

function toStaff(row: BackendStaff): StaffMember {
  return {
    id: row._id || row.id || "",
    name: row.name || "Staff Member",
    email: row.email || "staff@quickpress.com",
    phone: row.phone || "+91 98719 62596",
    role: row.role || "Operations Admin",
    scope: row.scope || "Kasganj Market Hub",
    permissions: row.permissions || ["orders", "partners", "riders"],
    lastActive: row.lastActive || "Recently",
    status: (row.status as StaffMember["status"]) || "Active",
    createdAt: (row.createdAt || "").slice(0, 10),
  };
}

export async function fetchStaff(): Promise<StaffMember[]> {
  try {
    const rows = await apiGetJson<BackendStaff[]>("/api/admin/staff");
    return (rows || []).map(toStaff);
  } catch {
    return [];
  }
}

export async function fetchRoles(): Promise<StaffRole[]> {
  try {
    return await apiGetJson<StaffRole[]>("/api/admin/staff/roles");
  } catch {
    return [];
  }
}

export async function fetchActivityLogs(actor?: string): Promise<ActivityLog[]> {
  try {
    const url = actor && actor !== "all" ? `/api/admin/staff/logs?actor=${encodeURIComponent(actor)}` : "/api/admin/staff/logs";
    return await apiGetJson<ActivityLog[]>(url);
  } catch {
    return [];
  }
}

export function inviteStaff(payload: Partial<StaffMember>) {
  return apiPostJson<BackendStaff>("/api/admin/staff", payload);
}

export function updateStaff(id: string, payload: Partial<StaffMember>) {
  return apiPutJson<BackendStaff>(`/api/admin/staff/${id}`, payload);
}

export function deleteStaff(id: string) {
  return apiDeleteJson<{ ok: boolean }>(`/api/admin/staff/${id}`);
}
