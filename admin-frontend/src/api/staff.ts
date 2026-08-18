/** GET/POST /api/admin/staff/* — real staff, roles and audit log data from the shared backend. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  lastActive: string;
  status: "Active" | "Invited" | "Disabled";
};

export type StaffRole = { id: string; name: string; members: number; permissions: string[] };

export type ActivityLog = { id: string; actor: string; action: string; target: string; at: string };

type BackendStaff = { _id: string; name: string; email: string; role: string; scope: string; lastActive: string; status: string };

function toStaff(row: BackendStaff): StaffMember {
  return {
    id: row._id,
    name: row.name,
    email: row.email,
    role: row.role,
    scope: row.scope,
    lastActive: row.lastActive ?? "—",
    status: (row.status as StaffMember["status"]) ?? "Invited",
  };
}

export async function fetchStaff(): Promise<StaffMember[]> {
  const rows = await apiGetJson<BackendStaff[]>("/api/admin/staff");
  return rows.map(toStaff);
}

export function fetchRoles(): Promise<StaffRole[]> {
  return apiGetJson<StaffRole[]>("/api/admin/staff/roles");
}

export function fetchActivityLogs(): Promise<ActivityLog[]> {
  return apiGetJson<ActivityLog[]>("/api/admin/staff/logs");
}

export function inviteStaff(payload: Record<string, string>) {
  return apiPostJson<BackendStaff>("/api/admin/staff", payload);
}
