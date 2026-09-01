/**
 * Unified Omnichannel Helpdesk & Support Engine API Client
 * (Customer Support, Partner Support & Captain Rider Support)
 *
 * GET /api/admin/support                 — Multi-role support inbox
 * GET /api/admin/support/{id}            — Live conversation thread
 * POST /api/admin/support/{id}/reply     — Send official resolution reply
 * POST /api/admin/support/{id}/close     — Mark ticket resolved
 */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

export type TicketRole = "Customer" | "Partner" | "Rider";

export type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  raisedBy: string;
  phone: string;
  role: TicketRole;
  source: TicketRole;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In progress" | "Resolved";
  category: string;
  refOrder?: string;
  assignee: string;
  updated: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  author: string;
  role?: string;
  body: string;
  at: string;
  me: boolean;
};

type BackendTicket = {
  _id: string;
  id?: string;
  ticketNumber?: string;
  subject?: string;
  raisedBy?: string;
  customer?: string;
  phone?: string;
  role?: string;
  source?: string;
  priority?: string;
  status?: string;
  category?: string;
  refOrder?: string;
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
  replies?: Array<{ _id?: string; author: string; role?: string; body: string; at: string }>;
};

function toTicket(row: BackendTicket): Ticket {
  const role = ((row.role || row.source || "Customer") as TicketRole);
  return {
    id: row._id || row.id || "",
    ticketNumber: row.ticketNumber || `TCK-${(row._id || "0000").slice(0, 4).toUpperCase()}`,
    subject: row.subject || "Support Inquiry",
    raisedBy: row.raisedBy || row.customer || "User",
    phone: row.phone || "+91 98719 62596",
    role: role,
    source: role,
    priority: ((row.priority || "Medium") as Ticket["priority"]),
    status: ((row.status || "Open") as Ticket["status"]),
    category: row.category || "General Inquiry",
    refOrder: row.refOrder || "—",
    assignee: row.assignee || "Himanshu (Lead Admin)",
    updated: (row.updatedAt || row.createdAt || "").slice(0, 16).replace("T", " "),
    createdAt: (row.createdAt || "").slice(0, 10),
  };
}

export async function fetchTickets(): Promise<Ticket[]> {
  try {
    const rows = await apiGetJson<BackendTicket[]>("/api/admin/support");
    return (rows || []).map(toTicket);
  } catch {
    return [];
  }
}

export async function fetchChat(ticketId: string): Promise<ChatMessage[]> {
  try {
    const ticket = await apiGetJson<BackendTicket>(`/api/admin/support/${ticketId}`);
    return (ticket.replies || []).map((reply, index) => ({
      id: reply._id || `${ticketId}-${index}`,
      author: reply.author || "User",
      role: reply.role,
      body: reply.body || "",
      at: (reply.at || "").slice(0, 16).replace("T", " "),
      me: reply.author?.toLowerCase().includes("support") || reply.author === "admin" || reply.role === "Admin",
    }));
  } catch {
    return [];
  }
}

export function replyToTicket(ticketId: string, body: string) {
  return apiPostJson<{ ok: boolean; ticketId: string; body: string }>(`/api/admin/support/${ticketId}/reply`, { body });
}

export function closeTicket(ticketId: string) {
  return apiPostJson<{ ok: boolean }>(`/api/admin/support/${ticketId}/close`, {});
}
