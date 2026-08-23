/** GET/POST /api/admin/support/* — real tickets from the shared backend. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

export type Ticket = {
  id: string;
  subject: string;
  raisedBy: string;
  source: "Customer" | "Partner" | "Rider";
  priority: "High" | "Medium" | "Low";
  assignee: string;
  updated: string;
  status: "Open" | "In progress" | "Resolved";
};

export type ChatMessage = { id: string; author: string; body: string; at: string; me: boolean };

type BackendTicket = {
  _id: string;
  subject: string;
  raisedBy: string;
  source: string;
  priority: string;
  assignee: string;
  updatedAt: string;
  status: string;
  replies?: { body: string; at: string; author: string }[];
};

function toTicket(row: BackendTicket): Ticket {
  return {
    id: row._id,
    subject: row.subject,
    raisedBy: row.raisedBy,
    source: (row.source as Ticket["source"]) ?? "Customer",
    priority: (row.priority as Ticket["priority"]) ?? "Medium",
    assignee: row.assignee ?? "Unassigned",
    updated: row.updatedAt ?? "—",
    status: (row.status as Ticket["status"]) ?? "Open",
  };
}

export async function fetchTickets(): Promise<Ticket[]> {
  const rows = await apiGetJson<BackendTicket[]>("/api/admin/support");
  return rows.map(toTicket);
}

export async function fetchChat(ticketId: string): Promise<ChatMessage[]> {
  const ticket = await apiGetJson<BackendTicket>(`/api/admin/support/${ticketId}`);
  return (ticket.replies ?? []).map((reply, index) => ({
    id: `${ticketId}-${index}`,
    author: reply.author,
    body: reply.body,
    at: reply.at,
    me: reply.author === "admin",
  }));
}

/** POST /api/admin/support/{id}/reply */
export function replyToTicket(ticketId: string, body: string) {
  return apiPostJson<{ ok: boolean; ticketId: string; body: string }>(`/api/admin/support/${ticketId}/reply`, { body });
}

/** POST /api/admin/support/{id}/close */
export function closeTicket(ticketId: string) {
  return apiPostJson<{ ok: boolean }>(`/api/admin/support/${ticketId}/close`, {});
}
