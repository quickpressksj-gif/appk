import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Send,
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Building2,
  Truck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { closeTicket, fetchChat, fetchTickets, replyToTicket, type Ticket } from "../api/support";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/support")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Helpdesk & Customer Support", "Manage tickets and real-time support conversations."),
  component: SupportPage,
});

export function SupportPage() {
  const queryClient = useQueryClient();
  const tickets = useQuery({ queryKey: ["admin", "tickets"], queryFn: fetchTickets });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  const allTickets = tickets.data ?? [];
  const active = selected ?? allTickets[0] ?? null;

  const chat = useQuery({
    queryKey: ["admin", "tickets", active?.id, "chat"],
    queryFn: () => fetchChat(active!.id),
    enabled: Boolean(active),
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => replyToTicket(active!.id, body),
    onSuccess: () => {
      toast.success("Reply sent to user!");
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", active?.id, "chat"] });
    },
    onError: () => {
      toast.error("Failed to transmit reply.");
    },
  });

  const closeMutation = useMutation({
    mutationFn: (ticketId: string) => closeTicket(ticketId),
    onSuccess: () => {
      toast.success("Ticket marked as resolved!");
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
    onError: () => {
      toast.error("Failed to update ticket status.");
    },
  });

  const metrics = useMemo(() => {
    const total = allTickets.length;
    const open = allTickets.filter((t) => t.status === "Open").length;
    const inProgress = allTickets.filter((t) => t.status === "In progress").length;
    const resolved = allTickets.filter((t) => t.status === "Resolved").length;
    return { total, open, inProgress, resolved };
  }, [allTickets]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTickets.filter((t) => {
      const matchesQuery = !q || [t.id, t.subject, t.raisedBy, t.source].join(" ").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesQuery && matchesStatus;
    });
  }, [allTickets, query, statusFilter]);

  return (
    <AdminShell
      title="Helpdesk & Support Operations"
      subtitle="Resolve customer escalations, partner inquiries, and rider delivery support tickets."
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "open-tck",
              label: "Open Escalations",
              value: metrics.open.toLocaleString("en-IN"),
              hint: "Requiring agent response",
              positive: metrics.open === 0,
            }}
          />
          <KpiCard
            kpi={{
              id: "prog-tck",
              label: "In Progress",
              value: metrics.inProgress.toLocaleString("en-IN"),
              hint: "Being investigated by staff",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "res-tck",
              label: "Resolved Tickets",
              value: metrics.resolved.toLocaleString("en-IN"),
              hint: `${metrics.total ? Math.round((metrics.resolved / metrics.total) * 100) : 100}% resolution rate`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "resp-time",
              label: "Avg First Response",
              value: "4.2 mins",
              hint: "Live chat and escalation SLA",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. TICKET WORKSPACE & LIVE CHAT PANE
        ========================================================================= */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          {/* Tickets Directory */}
          <div className="space-y-4">
            <SectionCard>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList className="bg-zinc-100 p-1 rounded-xl">
                    <TabsTrigger value="all" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                      All ({allTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="open" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                      Open ({metrics.open})
                    </TabsTrigger>
                    <TabsTrigger value="in progress" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                      In Progress ({metrics.inProgress})
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                      Resolved ({metrics.resolved})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by ticket subject, user name, or ID..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Ticket Queue"
              description="Click any ticket row to open the conversation thread and respond."
            >
              <DataTable
                loading={tickets.isLoading}
                rows={rows}
                onRowClick={setSelected}
                emptyMessage="No tickets match the selected criteria."
                columns={[
                  {
                    key: "subject",
                    label: "Ticket / Requester",
                    render: (r) => (
                      <div>
                        <p className="font-bold text-zinc-900 text-xs">{r.subject}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">#{r.id} · {r.raisedBy}</p>
                      </div>
                    ),
                  },
                  {
                    key: "source",
                    label: "Channel",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {r.source}
                      </span>
                    ),
                  },
                  {
                    key: "priority",
                    label: "Priority",
                    render: (r) => <StatusPill value={r.priority} />,
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                ]}
              />
            </SectionCard>
          </div>

          {/* Live Chat Pane */}
          <SectionCard
            title={active ? active.subject : "Support Conversation"}
            description={active ? `Ticket #${active.id} · ${active.raisedBy}` : "Select a ticket to begin resolution"}
          >
            {active ? (
              <div className="flex h-[480px] flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <StatusPill value={active.status} />
                    <span className="text-[11px] text-zinc-400 font-medium">Assigned: {active.assignee}</span>
                  </div>
                  {active.status !== "Resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold"
                      onClick={() => closeMutation.mutate(active.id)}
                    >
                      <CheckCircle2 className="mr-1 size-3" /> Resolve
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto py-3 pr-1">
                  {(chat.data ?? []).map((message) => (
                    <div
                      key={message.id}
                      className={message.me ? "flex justify-end" : "flex justify-start"}
                    >
                      <div
                        className={
                          message.me
                            ? "max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-600 px-3.5 py-2 text-xs text-white"
                            : "max-w-[85%] rounded-2xl rounded-bl-sm bg-zinc-100 px-3.5 py-2 text-xs text-zinc-900 border border-zinc-200"
                        }
                      >
                        <p className={`text-[10px] font-semibold ${message.me ? "text-emerald-100" : "text-zinc-500"}`}>
                          {message.author} · {message.at}
                        </p>
                        <p className="mt-1 font-medium leading-relaxed">{message.body}</p>
                      </div>
                    </div>
                  ))}
                  {chat.isLoading && <p className="text-xs text-zinc-400">Loading conversation thread...</p>}
                  {(!chat.data || chat.data.length === 0) && !chat.isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
                      <MessageSquare className="size-8 mb-2 opacity-40 text-emerald-600" />
                      <p className="text-xs">No replies yet in this thread.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-zinc-100 pt-3">
                  <Input
                    value={reply}
                    placeholder="Type an official resolution reply..."
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && reply.trim()) sendMutation.mutate(reply.trim());
                    }}
                    className="h-10 rounded-xl text-xs"
                  />
                  <Button
                    size="icon"
                    disabled={!reply.trim() || sendMutation.isPending}
                    onClick={() => sendMutation.mutate(reply.trim())}
                    className="size-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center text-zinc-400">
                <LifeBuoy className="size-10 mb-2 opacity-30 text-zinc-500" />
                <p className="text-xs font-semibold">Select a ticket from the left to view conversation history.</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
