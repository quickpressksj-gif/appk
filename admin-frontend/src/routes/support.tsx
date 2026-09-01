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
  Store,
  Bike,
  Sparkles,
  Phone,
  Tag,
  Check,
  RotateCcw,
  Zap,
  ShieldCheck,
  Building2,
  Truck,
  RefreshCw,
  Filter,
  Layers,
  ChevronRight,
  Headphones,
  Sliders,
  Radio,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { StatusPill, KpiCard, SectionCard } from "../components/AdminUI";
import {
  closeTicket,
  fetchChat,
  fetchTickets,
  replyToTicket,
  type Ticket,
  type TicketRole,
} from "../api/support";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/support")({
  beforeLoad: requireAdminSession,
  head: () =>
    adminHead(
      "Unified Helpdesk & Support Engine",
      "Omnichannel real-time support center combining Customer, Partner Hub, and Delivery Captain inquiries."
    ),
  component: SupportPage,
});

const CANNED_RESPONSES = [
  {
    role: "Customer",
    label: "👤 Rider on the way",
    text: "Hello, our assigned delivery captain is on the way to your location and will reach within 10 minutes. Thank you for your patience!",
  },
  {
    role: "Customer",
    label: "💰 Refund processed",
    text: "We have reviewed your request and credited ₹50 promo wallet balance to your QuickPress account. You can use it on your next wash!",
  },
  {
    role: "Partner",
    label: "🏪 Store dispatch update",
    text: "We have noted your machine status. New incoming steam iron orders have been temporarily rerouted to Soron Gate Hub for today.",
  },
  {
    role: "Rider",
    label: "🚴 Customer phone alert",
    text: "Please wait 5 minutes at the customer address. Our support team has dialed the customer's alternate number to open the gate.",
  },
  {
    role: "All",
    label: "🌧️ Rain delay notice",
    text: "Due to heavy rainfall in Kasganj, our captains are operating with water-sealed bags. A 15-20 min transit buffer is active.",
  },
];

export function SupportPage() {
  const queryClient = useQueryClient();
  const tickets = useQuery({ queryKey: ["admin", "tickets"], queryFn: fetchTickets });

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const allTickets = tickets.data ?? [];

  // Active Selected Ticket
  const activeTicket = useMemo(() => {
    if (selectedTicketId) {
      const found = allTickets.find((t) => t.id === selectedTicketId);
      if (found) return found;
    }
    return allTickets[0] ?? null;
  }, [allTickets, selectedTicketId]);

  // Live Chat Messages
  const chatQuery = useQuery({
    queryKey: ["admin", "tickets", activeTicket?.id, "chat"],
    queryFn: () => fetchChat(activeTicket!.id),
    enabled: Boolean(activeTicket),
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => replyToTicket(activeTicket!.id, body),
    onSuccess: () => {
      toast.success("Support resolution reply sent! 🎉");
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", activeTicket?.id, "chat"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
    onError: () => {
      toast.error("Failed to send reply.");
    },
  });

  const closeMutation = useMutation({
    mutationFn: (ticketId: string) => closeTicket(ticketId),
    onSuccess: () => {
      toast.success("Ticket marked as resolved & closed! 🏆");
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", activeTicket?.id, "chat"] });
    },
    onError: () => {
      toast.error("Failed to resolve ticket.");
    },
  });

  // Metrics
  const metrics = useMemo(() => {
    const total = allTickets.length;
    const open = allTickets.filter((t) => t.status === "Open").length;
    const inProgress = allTickets.filter((t) => t.status === "In progress").length;
    const resolved = allTickets.filter((t) => t.status === "Resolved").length;
    const customerCount = allTickets.filter((t) => t.role === "Customer").length;
    const partnerCount = allTickets.filter((t) => t.role === "Partner").length;
    const riderCount = allTickets.filter((t) => t.role === "Rider").length;

    return { total, open, inProgress, resolved, customerCount, partnerCount, riderCount };
  }, [allTickets]);

  // Filtered List
  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTickets.filter((t) => {
      const matchRole = roleFilter === "all" || t.role.toLowerCase() === roleFilter.toLowerCase();
      const matchStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
      const matchPriority = priorityFilter === "all" || t.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchSearch =
        !q ||
        [t.ticketNumber, t.subject, t.raisedBy, t.phone, t.category, t.refOrder || ""]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return matchRole && matchStatus && matchPriority && matchSearch;
    });
  }, [allTickets, roleFilter, statusFilter, priorityFilter, searchQuery]);

  return (
    <AdminShell
      title="Unified Helpdesk & Support Engine"
      subtitle="Combined omnichannel inbox resolving live escalations from Customers, Partner Store Hubs, and Delivery Captains."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              tickets.refetch();
              if (activeTicket) chatQuery.refetch();
              toast.success("Support tickets refreshed!");
            }}
            disabled={tickets.isRefetching}
            className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${tickets.isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP COMBINED METRIC CARDS (6 METRICS)
        ========================================================================= */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            kpi={{
              id: "open-tck",
              label: "Active Escalations",
              value: `${metrics.open + metrics.inProgress} Active`,
              hint: `${metrics.open} Open · ${metrics.inProgress} In Progress`,
              positive: metrics.open === 0,
            }}
          />
          <KpiCard
            kpi={{
              id: "cust-tck",
              label: "Customer Inquiries",
              value: `${metrics.customerCount} Tickets`,
              hint: "Users & orders",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "part-tck",
              label: "Partner Store Hubs",
              value: `${metrics.partnerCount} Tickets`,
              hint: "QA & store operations",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "rdr-tck",
              label: "Captain Fleet Issues",
              value: `${metrics.riderCount} Tickets`,
              hint: "On-road & COD support",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "speed-tck",
              label: "Avg Resolution Speed",
              value: "12.5 Mins",
              hint: "SLA response benchmark",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "res-tck",
              label: "Helpdesk Resolution",
              value: `${metrics.resolved} Solved`,
              hint: `${metrics.total ? Math.round((metrics.resolved / metrics.total) * 100) : 100}% resolution rate`,
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. MULTI-ROLE OMNICHANNEL SUPPORT WORKSPACE (2 PANES)
        ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* =====================================================================
              LEFT PANE: TICKET QUEUE & ROLE FILTERS (5 COLS)
          ===================================================================== */}
          <div className="lg:col-span-5 space-y-4">
            <SectionCard>
              {/* Role Filter Tabs */}
              <div className="pb-3 border-b border-zinc-100">
                <Tabs value={roleFilter} onValueChange={setRoleFilter}>
                  <TabsList className="grid grid-cols-4 w-full bg-zinc-100 p-1 rounded-xl">
                    <TabsTrigger value="all" className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                      🌐 All ({allTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="customer" className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                      👤 User ({metrics.customerCount})
                    </TabsTrigger>
                    <TabsTrigger value="partner" className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                      🏪 Store ({metrics.partnerCount})
                    </TabsTrigger>
                    <TabsTrigger value="rider" className="text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                      🚴 Rider ({metrics.riderCount})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Search & Filters */}
              <div className="pt-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ticket, name, phone, issue..."
                    className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 rounded-lg bg-zinc-50 border-zinc-200 text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">● Open</SelectItem>
                      <SelectItem value="in progress">⚡ In progress</SelectItem>
                      <SelectItem value="resolved">✓ Resolved</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-8 rounded-lg bg-zinc-50 border-zinc-200 text-xs">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">🔴 High Priority</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tickets List */}
              <div className="mt-4 space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {filteredTickets.map((t) => {
                  const isSelected = activeTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all text-xs space-y-2 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-7 items-center justify-center rounded-lg font-bold text-xs ${
                              t.role === "Customer"
                                ? "bg-purple-100 text-purple-800"
                                : t.role === "Partner"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {t.role === "Customer" ? <User className="size-3.5" /> : t.role === "Partner" ? <Store className="size-3.5" /> : <Bike className="size-3.5" />}
                          </div>
                          <div>
                            <span className="font-mono text-[10px] font-black text-zinc-900">{t.ticketNumber}</span>
                            <span className="text-[10px] text-zinc-400 ml-1.5 capitalize font-medium">{t.role}</span>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                            t.priority === "High"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : t.priority === "Medium"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <p className="font-bold text-zinc-900 line-clamp-1">{t.subject}</p>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100/80">
                        <span className="font-medium text-zinc-600 truncate max-w-[140px]">{t.raisedBy}</span>
                        <StatusPill value={t.status} />
                      </div>
                    </div>
                  );
                })}

                {filteredTickets.length === 0 && (
                  <div className="py-12 text-center text-xs text-zinc-400">
                    No tickets found matching your filter criteria.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* =====================================================================
              RIGHT PANE: LIVE CONVERSATION & RESOLUTION DESK (7 COLS)
          ===================================================================== */}
          <div className="lg:col-span-7">
            {activeTicket ? (
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden flex flex-col h-[720px]">
                {/* Desk Header */}
                <div className="p-4 border-b border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-11 items-center justify-center rounded-2xl font-bold text-sm shadow-xs ${
                        activeTicket.role === "Customer"
                          ? "bg-purple-600 text-white"
                          : activeTicket.role === "Partner"
                          ? "bg-emerald-600 text-white"
                          : "bg-sky-600 text-white"
                      }`}
                    >
                      {activeTicket.role === "Customer" ? <User className="size-5" /> : activeTicket.role === "Partner" ? <Store className="size-5" /> : <Bike className="size-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-zinc-900">{activeTicket.ticketNumber}</span>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[9px] font-black uppercase ${
                            activeTicket.role === "Customer"
                              ? "bg-purple-100 text-purple-800"
                              : activeTicket.role === "Partner"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {activeTicket.role}
                        </span>
                        <StatusPill value={activeTicket.status} />
                      </div>
                      <h4 className="font-bold text-zinc-900 text-xs mt-0.5">{activeTicket.subject}</h4>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>{activeTicket.raisedBy}</span>
                        <span>·</span>
                        <a href={`tel:${activeTicket.phone}`} className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
                          <Phone className="size-2.5" /> {activeTicket.phone}
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTicket.status !== "Resolved" ? (
                      <Button
                        size="sm"
                        className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs"
                        onClick={() => closeMutation.mutate(activeTicket.id)}
                        disabled={closeMutation.isPending}
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Mark Resolved
                      </Button>
                    ) : (
                      <span className="rounded-full bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 border border-emerald-200">
                        ✓ Ticket Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Context Bar */}
                <div className="px-4 py-2 bg-zinc-100/60 border-b border-zinc-200/80 flex items-center justify-between text-[11px] text-zinc-600">
                  <div className="flex items-center gap-3">
                    <span>
                      Category: <strong>{activeTicket.category}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Linked Order: <strong>{activeTicket.refOrder || "None"}</strong>
                    </span>
                  </div>
                  <span>
                    Assignee: <strong>{activeTicket.assignee}</strong>
                  </span>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/30">
                  {(chatQuery.data || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[85%] ${
                        msg.me ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          msg.me ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {msg.me ? "QP" : activeTicket.raisedBy.slice(0, 1).toUpperCase()}
                      </div>

                      <div
                        className={`rounded-2xl p-3.5 text-xs shadow-xs space-y-1 ${
                          msg.me
                            ? "bg-emerald-600 text-white rounded-tr-none"
                            : "bg-white text-zinc-900 border border-zinc-200 rounded-tl-none"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-[10px] font-bold ${msg.me ? "text-emerald-100" : "text-zinc-500"}`}>
                            {msg.author}
                          </span>
                          <span className={`text-[9px] ${msg.me ? "text-emerald-200" : "text-zinc-400"}`}>
                            {msg.at}
                          </span>
                        </div>
                        <p className="leading-relaxed">{msg.body}</p>
                      </div>
                    </div>
                  ))}

                  {(!chatQuery.data || chatQuery.data.length === 0) && (
                    <div className="py-20 text-center text-xs text-zinc-400">
                      No message history found for this ticket. Type a reply below to initiate conversation.
                    </div>
                  )}
                </div>

                {/* Canned Quick Responses */}
                <div className="p-2 border-t border-zinc-100 bg-white flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase shrink-0 px-2">Fast Canned:</span>
                  {CANNED_RESPONSES.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReplyText(c.text)}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-bold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 shrink-0 transition-colors"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Reply Input Box */}
                <div className="p-3 border-t border-zinc-200 bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <Textarea
                      placeholder="Type official support resolution reply to customer, partner, or captain..."
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          if (replyText.trim()) sendMutation.mutate(replyText);
                        }
                      }}
                      className="text-xs resize-none"
                    />
                    <Button
                      className="h-16 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shrink-0"
                      onClick={() => sendMutation.mutate(replyText)}
                      disabled={!replyText.trim() || sendMutation.isPending}
                    >
                      <Send className="size-4 mr-1.5" />
                      <span>{sendMutation.isPending ? "Sending..." : "Send Reply"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-400">
                Select a support ticket from the left inbox to open the live resolution workspace.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
