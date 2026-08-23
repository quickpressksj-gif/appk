import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Bell,
  Smartphone,
  Users,
  Building2,
  Truck,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Radio,
  Layers,
  MessageSquare,
  Zap,
  Target,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { fetchCampaigns, sendBroadcast, type Campaign } from "../api/notifications";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Broadcast Notifications", "Send announcements, alerts, and campaigns to QuickPress users."),
  component: NotificationsPage,
});

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const campaigns = useQuery({ queryKey: ["admin", "campaigns"], queryFn: fetchCampaigns });
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "Customers",
    channel: "In-app",
  });
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allCampaigns = campaigns.data ?? [];

  const sendMutation = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: () => {
      toast.success("Broadcast transmitted successfully to all active device feeds!");
      setForm({ title: "", body: "", audience: "Customers", channel: "In-app" });
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    },
    onError: () => {
      toast.error("Failed to transmit broadcast.");
    },
  });

  const metrics = useMemo(() => {
    const total = allCampaigns.length;
    const customerCampaigns = allCampaigns.filter((c) => c.audience === "Customers" || c.audience === "All").length;
    const partnerCampaigns = allCampaigns.filter((c) => c.audience === "Partners" || c.audience === "All").length;
    const riderCampaigns = allCampaigns.filter((c) => c.audience === "Riders" || c.audience === "All").length;
    return { total, customerCampaigns, partnerCampaigns, riderCampaigns };
  }, [allCampaigns]);

  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCampaigns.filter((c) => {
      const matchQuery = !q || [c.title, c.message, c.audience].join(" ").toLowerCase().includes(q);
      const matchTab =
        activeTab === "all" ||
        (activeTab === "customers" && (c.audience === "Customers" || c.audience === "All")) ||
        (activeTab === "partners" && (c.audience === "Partners" || c.audience === "All")) ||
        (activeTab === "riders" && (c.audience === "Riders" || c.audience === "All"));
      return matchQuery && matchTab;
    });
  }, [allCampaigns, searchQuery, activeTab]);

  return (
    <AdminShell
      title="Push Notifications & Campaign Center"
      subtitle="Dispatch live alerts, promotional banners, and operational bulletins to QuickPress mobile devices."
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "tot-notif",
              label: "Dispatched Campaigns",
              value: metrics.total.toLocaleString("en-IN"),
              hint: "Live delivery to device notification hubs",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "cust-alerts",
              label: "Customer Broadcasts",
              value: metrics.customerCampaigns.toLocaleString("en-IN"),
              hint: "Promo vouchers & service updates",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "part-alerts",
              label: "Partner Store Bulletins",
              value: metrics.partnerCampaigns.toLocaleString("en-IN"),
              hint: "SLA guidelines & payout notifications",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "rdr-alerts",
              label: "Fleet Push Dispatches",
              value: metrics.riderCampaigns.toLocaleString("en-IN"),
              hint: "Surge incentives & safety advisories",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. INTERACTIVE CAMPAIGN BUILDER + LIVE MOBILE PREVIEW
        ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Builder Form */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Megaphone className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900">Compose Broadcast Campaign</h3>
                    <p className="text-xs text-zinc-500 font-medium">Delivered instantly to user notification feeds.</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800">
                  <Radio className="size-3 animate-pulse" /> Live Broadcast
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {/* Target Audience Segment Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Target Audience Segment</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "Customers", label: "Customers", icon: Users },
                      { id: "Partners", label: "Partners", icon: Building2 },
                      { id: "Riders", label: "Riders Fleet", icon: Truck },
                      { id: "All", label: "All Users", icon: Target },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = form.audience === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, audience: item.id }))}
                          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-xs font-bold transition-all ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                              : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100/80"
                          }`}
                        >
                          <Icon className={`size-4 ${isSelected ? "text-emerald-700" : "text-zinc-500"}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Campaign Title</Label>
                  <Input
                    value={form.title}
                    placeholder="e.g. 🌧️ Monsoon Special: Flat 30% Off on Wash & Fold!"
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="h-11 rounded-2xl text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Notification Message Body</Label>
                  <Textarea
                    rows={4}
                    value={form.body}
                    placeholder="Enjoy crisp, dry, wrinkle-free laundry delivered to your doorstep in 24 hours. Use code MONSOON30 at checkout."
                    onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                    className="rounded-2xl text-xs resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[11px] text-zinc-400 font-medium">
                    ⚡ Instant delivery via real-time WebSocket & in-app message bus.
                  </div>
                  <Button
                    className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white px-6 h-11 shadow-xs"
                    disabled={sendMutation.isPending || !form.title.trim() || !form.body.trim()}
                    onClick={() => {
                      if (!form.title || !form.body) {
                        toast.error("Please provide both a title and message body.");
                        return;
                      }
                      sendMutation.mutate(form);
                    }}
                  >
                    <Send className="mr-2 size-3.5" />
                    <span>Send Broadcast</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Mobile Notification Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full max-w-[340px] rounded-3xl border-4 border-zinc-900 bg-zinc-950 p-4 shadow-2xl">
              {/* Phone Top Notch */}
              <div className="flex items-center justify-between px-2 pt-1 pb-4">
                <span className="text-[10px] font-bold text-zinc-400 font-mono">9:41</span>
                <div className="h-4 w-20 rounded-full bg-zinc-800" />
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-400">5G</span>
                </div>
              </div>

              {/* Notification Banner on Phone Screen */}
              <div className="min-h-[280px] rounded-2xl bg-gradient-to-b from-zinc-800/80 to-zinc-900/80 p-3.5 backdrop-blur-md border border-white/10">
                <div className="rounded-2xl bg-white/95 p-3.5 shadow-lg border border-white/20 text-zinc-900 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-5 items-center justify-center rounded-md bg-emerald-600 text-white font-black text-[9px]">
                        QP
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-800">
                        QuickPress {form.audience ? `· ${form.audience}` : ""}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">Just now</span>
                  </div>

                  <p className="mt-2 text-xs font-black text-zinc-900 leading-snug">
                    {form.title.trim() || "Notification Title Preview"}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-600 font-medium leading-relaxed">
                    {form.body.trim() || "Your announcement message body will appear here on customer & partner phones."}
                  </p>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-[11px] font-bold text-zinc-400">Mobile Notification Mockup</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Real-time dynamic device preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. PAST BROADCAST CAMPAIGNS LOG
        ========================================================================= */}
        <div className="space-y-4">
          <SectionCard>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-100 p-1 rounded-xl">
                  <TabsTrigger value="all" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    All Dispatches ({allCampaigns.length})
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    Customers ({metrics.customerCampaigns})
                  </TabsTrigger>
                  <TabsTrigger value="partners" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    Partners ({metrics.partnerCampaigns})
                  </TabsTrigger>
                  <TabsTrigger value="riders" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    Riders Fleet ({metrics.riderCampaigns})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns..."
                  className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="mt-4">
              <DataTable
                loading={campaigns.isLoading}
                rows={filteredCampaigns}
                emptyMessage="No broadcast campaigns match these filters."
                columns={[
                  {
                    key: "title",
                    label: "Campaign Details",
                    render: (r) => (
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs">
                          <Bell className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{r.title}</p>
                          <p className="text-[11px] text-zinc-400 font-medium line-clamp-1">{r.message}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "audience",
                    label: "Audience Segment",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700">
                        {r.audience}
                      </span>
                    ),
                  },
                  {
                    key: "sent",
                    label: "Dispatched Time",
                    render: (r) => (
                      <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                        <Clock className="size-3.5 text-zinc-400" />
                        {r.sent}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Delivery Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                ]}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
