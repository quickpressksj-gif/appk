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
  Phone,
  Tag,
  Check,
  RotateCcw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { StatusPill, KpiCard } from "../components/AdminUI";
import { closeTicket, fetchChat, fetchTickets, replyToTicket, type Ticket } from "../api/support";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/support")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Helpdesk & Live Support", "Omnichannel support inbox for QuickPress users."),
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
      toast.success("Support reply sent to user!");
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
      toast.error("Failed to resolve ticket.");
    },
  });

  const metrics = useMemo(() => {
    const total = allTickets.length;
    const open = allTickets.filter((t) => t.status === "Open").length;
    const inProgress = allTickets.filter((t) => t.status === "In progress").length;
    const resolved = allTickets.filter((t) => t.status === "Resolved").length;
    return { total, open, inProgress, resolved };
  }, [allTickets]);

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTickets.filter((t) => {
      const matchesQuery = !q || [t.id, t.subject, t.raisedBy, t.source].join(" ").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesQuery && matchesStatus;
    });
  }, [allTickets, query, statusFilter]);

  const cannedResponses = [
    "We are checking with our assigned delivery rider and will update you shortly.",
    "Your laundry has reached the partner store and processing has begun.",
    "The refund has been initiated to your QuickPress wallet.",
    "Pickup slot has been rescheduled as per your request.",
  ];

  return (
    <AdminShell
      title="Omnichannel Helpdesk & Live Support"
      subtitle="Resolve real-time support requests, order inquiries, and escalations from customers, partners, and riders."
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
              hint: "Awaiting staff response",
              positive: metrics.open === 0,
            }}
          />
          <KpiCard
            kpi={{
              id: "prog-tck",
              label: "In Progress",
              value: metrics.inProgress.toLocaleString("en-IN"),
              hint: "Under active investigation",
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
              label: "First Response SLA",
              value: "3.8 mins",
              hint: "Average resolution velocity",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. UNIFIED INBOX & CONVERSATION WORKSPACE
        ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12 rounded-3xl border border-zinc-200 bg-white shadow-xs overflow-hidden min-h-[640px]">
          {/* Left Panel: Ticket Queue List */}
          <div className="lg:col-span-5 border-r border-zinc-200 flex flex-col bg-zinc-50/50">
            {/* Header & Filter Tabs */}
            <div className="p-4 border-b border-zinc-200 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-900">Support Inbox</h3>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-zinc-700">
                  {filteredTickets.length} tickets
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by ticket, name, ID..."
                  className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="bg-zinc-100 p-0.5 rounded-xl w-full grid grid-cols-4">
                  <TabsTrigger value="all" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="open" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    Open ({metrics.open})
                  </TabsTrigger>
                  <TabsTrigger value="in progress" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    Resolved
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Ticket Scrollable Queue */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 p-2 space-y-1">
              {filteredTickets.map((t) => {
                const isSelected = active?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all ${
                      isSelected
                        ? "bg-emerald-50/90 border border-emerald-300 shadow-xs"
                        : "bg-white hover:bg-zinc-100/80 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 font-black text-[10px]">
                          {t.source === "Partner" ? (
                            <Building2 className="size-3.5" />
                          ) : t.source === "Rider" ? (
                            <Truck className="size-3.5" />
                          ) : (
                            <User className="size-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 leading-tight line-clamp-1">{t.subject}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{t.raisedBy} · #{t.id}</p>
                        </div>
                      </div>
                      <StatusPill value={t.status} />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                      <span className="font-semibold text-zinc-600">{t.source} App</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {t.updated}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredTickets.length === 0 && (
                <div className="p-8 text-center text-zinc-400">
                  <LifeBuoy className="size-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                  <p className="text-xs font-bold">No tickets match criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live Conversation Thread */}
          <div className="lg:col-span-7 flex flex-col bg-white">
            {active ? (
              <div className="flex flex-col h-full justify-between">
                {/* Active Ticket Header */}
                <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-zinc-900">{active.subject}</h4>
                      <StatusPill value={active.status} />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      Requester: <span className="font-bold text-zinc-800">{active.raisedBy}</span> ({active.source}) · Ticket #{active.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {active.status !== "Resolved" ? (
                      <Button
                        size="sm"
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 h-8.5 shadow-xs"
                        onClick={() => closeMutation.mutate(active.id)}
                      >
                        <CheckCircle2 className="mr-1.5 size-3.5" /> Mark Resolved
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                        <Check className="size-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Bubble Feed */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-gradient-to-b from-zinc-50/30 to-white">
                  {(chat.data ?? []).map((message) => (
                    <div
                      key={message.id}
                      className={message.me ? "flex justify-end" : "flex justify-start"}
                    >
                      <div
                        className={
                          message.me
                            ? "max-w-[80%] rounded-2xl rounded-tr-xs bg-emerald-600 p-3.5 text-xs text-white shadow-xs"
                            : "max-w-[80%] rounded-2xl rounded-tl-xs bg-white border border-zinc-200 p-3.5 text-xs text-zinc-900 shadow-xs"
                        }
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-[10px] font-bold ${message.me ? "text-emerald-100" : "text-zinc-500"}`}>
                            {message.author}
                          </span>
                          <span className={`text-[9px] font-medium ${message.me ? "text-emerald-200" : "text-zinc-400"}`}>
                            {message.at}
                          </span>
                        </div>
                        <p className="mt-1.5 font-medium leading-relaxed">{message.body}</p>
                      </div>
                    </div>
                  ))}

                  {(!chat.data || chat.data.length === 0) && !chat.isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 py-12">
                      <MessageSquare className="size-10 mb-2 opacity-30 text-emerald-600" />
                      <p className="text-xs font-bold text-zinc-600">Start the conversation</p>
                      <p className="text-[11px] text-zinc-400">Type an official reply below or select a quick template.</p>
                    </div>
                  )}
                </div>

                {/* Canned Quick Templates */}
                <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50/50 flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] font-black uppercase text-zinc-400 shrink-0">Quick Templates:</span>
                  {cannedResponses.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReply(res)}
                      className="shrink-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                      {res.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* Reply Composer Bar */}
                <div className="p-4 border-t border-zinc-200 bg-white flex gap-2">
                  <Input
                    value={reply}
                    placeholder="Type official support resolution reply..."
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && reply.trim()) sendMutation.mutate(reply.trim());
                    }}
                    className="h-11 rounded-2xl text-xs bg-zinc-50 border-zinc-200 focus:bg-white"
                  />
                  <Button
                    size="icon"
                    disabled={!reply.trim() || sendMutation.isPending}
                    onClick={() => sendMutation.mutate(reply.trim())}
                    className="size-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 py-24">
                <LifeBuoy className="size-12 mb-3 opacity-30 text-emerald-600" />
                <h4 className="text-sm font-bold text-zinc-700">No Ticket Selected</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Select an escalation from the left queue to open live chat.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
