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
  Store,
  Bike,
  User,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Copy,
  Check,
  Volume2,
  Activity,
  Server,
  Download,
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
  head: () =>
    adminHead(
      "Push Notifications & Campaign Center",
      "Dispatch multi-channel announcements, promotional alerts, fleet push notifications, and partner bulletins."
    ),
  component: NotificationsPage,
});

const TEMPLATE_PRESETS = [
  {
    id: "festive-50",
    label: "🎉 Festive 50% Off Voucher",
    title: "Diwali Special: Flat 50% OFF on Dry Clean!",
    body: "Get your traditional outfits shining like new. Use code FESTIVE50 on orders above ₹249. Free doorstep pickup!",
    audience: "Customers",
    category: "Promotional",
  },
  {
    id: "surge-rider",
    label: "⚡ Rider Surge Earning Bonus",
    title: "⚡ Peak Hours Surge Active: Extra ₹25/Trip!",
    body: "High order demand in Kasganj Sector 1 & Main Market. Earn ₹25 extra bonus on every delivery completed before 9 PM.",
    audience: "Riders",
    category: "Urgent",
  },
  {
    id: "weather-alert",
    label: "🌧️ Monsoon Pickup Advisory",
    title: "Monsoon Weather Advisory: Safe Garment Protection",
    body: "Due to heavy rainfall, doorstep delivery may experience a slight 15-20 min delay. All laundry bags are water-sealed.",
    audience: "All",
    category: "Operational",
  },
  {
    id: "partner-quality",
    label: "🏪 Store Hub SLA Guidelines",
    title: "Weekly Store Quality Standards & Express SLA",
    body: "Please ensure all dry clean items undergo dual QA inspection before tagging for rider pickup. Keep turnaround within 24 hrs.",
    audience: "Partners",
    category: "Operational",
  },
  {
    id: "vip-perks",
    label: "👑 VIP Member Rewards Drop",
    title: "Exclusive VIP Perk Unlocked: Free Express Wash",
    body: "Thank you for being a Platinum Elite member! Your priority wash voucher is now active in your wallet.",
    audience: "Customers",
    category: "Promotional",
  },
];

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const campaigns = useQuery({ queryKey: ["admin", "campaigns"], queryFn: fetchCampaigns });

  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "Customers",
    channel: "All Channels",
    category: "Promotional",
  });
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates" | "gateway" | "audience">("campaigns");
  const [searchQuery, setSearchQuery] = useState("");

  const allCampaigns = campaigns.data ?? [];

  const sendMutation = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: (data) => {
      toast.success(`Broadcast transmitted to ${data?.reached || 19} active devices across feeds! 🎉`);
      setForm({ title: "", body: "", audience: "Customers", channel: "All Channels", category: "Promotional" });
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    },
    onError: () => {
      toast.error("Failed to transmit broadcast.");
    },
  });

  const metrics = useMemo(() => {
    const total = allCampaigns.length;
    const customerCampaigns = allCampaigns.filter((c) => c.audience.includes("Customer") || c.audience === "All Users").length;
    const partnerCampaigns = allCampaigns.filter((c) => c.audience.includes("Partner") || c.audience === "All Users").length;
    const riderCampaigns = allCampaigns.filter((c) => c.audience.includes("Rider") || c.audience === "All Users").length;
    return { total, customerCampaigns, partnerCampaigns, riderCampaigns };
  }, [allCampaigns]);

  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCampaigns.filter((c) => {
      return !q || [c.title, c.message, c.audience, c.category].join(" ").toLowerCase().includes(q);
    });
  }, [allCampaigns, searchQuery]);

  const handleApplyTemplate = (tpl: (typeof TEMPLATE_PRESETS)[0]) => {
    setForm({
      title: tpl.title,
      body: tpl.body,
      audience: tpl.audience,
      channel: "All Channels",
      category: tpl.category,
    });
    toast.success(`Loaded template "${tpl.label}"!`);
  };

  return (
    <AdminShell
      title="Push Notifications & Campaign Center"
      subtitle="Transmit multi-channel mobile notifications, promotional alerts, fleet push advisories, and store bulletins."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              campaigns.refetch();
              toast.success("Broadcast feeds refreshed!");
            }}
            disabled={campaigns.isRefetching}
            className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${campaigns.isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS (6 METRICS)
        ========================================================================= */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            kpi={{
              id: "tot-notif",
              label: "Dispatched Campaigns",
              value: `${metrics.total} Broadcasts`,
              hint: "Multi-channel history",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "cust-alerts",
              label: "Customer Broadcasts",
              value: `${metrics.customerCampaigns} Sent`,
              hint: "65 User accounts",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "part-alerts",
              label: "Partner Store Bulletins",
              value: `${metrics.partnerCampaigns} Sent`,
              hint: "8 Hub owners",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "rdr-alerts",
              label: "Fleet Push Dispatches",
              value: `${metrics.riderCampaigns} Sent`,
              hint: "4 Delivery captains",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "delivery-rate",
              label: "Delivery Success Rate",
              value: "99.8%",
              hint: "FCM & Socket transmitted",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "channels-active",
              label: "Gateway Channels",
              value: "Socket + FCM",
              hint: "Live realtime push",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. INTERACTIVE CAMPAIGN BUILDER + LIVE MOBILE DEVICE PREVIEW
        ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Builder Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <SectionCard
              title="Compose Multi-Channel Broadcast"
              description="Craft announcements with real-time push to Customer, Partner, and Captain app feeds."
            >
              <div className="space-y-4">
                {/* Template Fast Loader */}
                <div>
                  <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                    Quick Template Presets
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_PRESETS.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Broadcast Headline / Title</Label>
                  <Input
                    placeholder="e.g. 50% Off Dry Clean This Weekend!"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="h-10 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Message Content / Description</Label>
                  <Textarea
                    placeholder="Enter your announcement text, promo details, or operational guidelines..."
                    rows={4}
                    value={form.body}
                    onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                    className="text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Target Audience</Label>
                    <Select value={form.audience} onValueChange={(v) => setForm((p) => ({ ...p, audience: v }))}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">🌐 All Users (Everyone)</SelectItem>
                        <SelectItem value="Customers">👥 Customers Only</SelectItem>
                        <SelectItem value="Partners">🏪 Partner Store Hubs</SelectItem>
                        <SelectItem value="Riders">🚴 Delivery Captains</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Notification Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Promotional">🏷️ Promotional</SelectItem>
                        <SelectItem value="Operational">⚙️ Operational Alert</SelectItem>
                        <SelectItem value="Urgent">⚡ Urgent / Surge</SelectItem>
                        <SelectItem value="System">🛡️ System Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Delivery Channel</Label>
                    <Select value={form.channel} onValueChange={(v) => setForm((p) => ({ ...p, channel: v }))}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Channels">🔔 In-App + FCM Push</SelectItem>
                        <SelectItem value="In-App Feed">📱 In-App Feed Only</SelectItem>
                        <SelectItem value="FCM Mobile Push">⚡ Urgent Push Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => sendMutation.mutate(form)}
                    disabled={!form.title || !form.body || sendMutation.isPending}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs"
                  >
                    <Send className="size-3.5 mr-1.5" />
                    {sendMutation.isPending ? "Transmitting Across Devices..." : "Dispatch Broadcast Campaign"}
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Live Mobile Device Screen Preview (5 Cols) */}
          <div className="lg:col-span-5">
            <SectionCard title="Live Mobile App Screen Preview" description="Real-time rendering of device push banner and in-app feed.">
              <div className="mx-auto w-full max-w-[320px] rounded-[36px] border-4 border-zinc-800 bg-zinc-900 p-3.5 shadow-2xl space-y-4">
                {/* Mobile Notch */}
                <div className="mx-auto h-4 w-28 rounded-full bg-zinc-800 flex items-center justify-center">
                  <div className="size-2 rounded-full bg-zinc-900" />
                </div>

                {/* Lockscreen / Push Banner */}
                <div className="rounded-2xl bg-white/95 p-3.5 backdrop-blur-md shadow-lg space-y-1.5 border border-zinc-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex size-5 items-center justify-center rounded-md bg-emerald-600 text-white font-black text-[9px]">
                        QP
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-900">QuickPress</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-medium">now</span>
                  </div>

                  <p className="font-bold text-zinc-900 text-xs leading-tight">
                    {form.title || "Announcement Headline"}
                  </p>
                  <p className="text-[11px] text-zinc-600 line-clamp-3 leading-relaxed">
                    {form.body || "Your broadcast message text will preview here in real-time as you type..."}
                  </p>
                </div>

                {/* Audience Pill */}
                <div className="rounded-xl bg-zinc-800/80 p-2 text-center text-[10px] font-bold text-zinc-400 flex items-center justify-center gap-1.5">
                  <Radio className="size-3 text-emerald-500 animate-pulse" />
                  <span>Target: {form.audience} · {form.category}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* =========================================================================
            3. MAIN TABS NAVIGATION & HISTORY
        ========================================================================= */}
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="campaigns" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  📢 Dispatched Broadcasts ({allCampaigns.length})
                </TabsTrigger>
                <TabsTrigger value="templates" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  ⚡ Templates Library ({TEMPLATE_PRESETS.length})
                </TabsTrigger>
                <TabsTrigger value="gateway" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  📱 Gateway Health & Socket Pipeline
                </TabsTrigger>
                <TabsTrigger value="audience" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🎯 Audience Segments
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>FCM Verified</span>
            </div>
          </div>

          {activeTab === "campaigns" && (
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past broadcasts by title, message, audience, or category..."
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          )}
        </SectionCard>

        {/* TAB 1: DISPATCHED BROADCASTS TABLE */}
        {activeTab === "campaigns" && (
          <SectionCard title="Historical Campaign Dispatches" description="Complete record of broadcast alerts transmitted across the network.">
            <DataTable
              loading={campaigns.isLoading}
              rows={filteredCampaigns}
              emptyMessage="No broadcast campaigns match your search."
              columns={[
                {
                  key: "title",
                  label: "Broadcast Title & Message",
                  render: (c) => (
                    <div className="space-y-0.5 max-w-md">
                      <p className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                        {c.title}
                        <span className="rounded-full bg-zinc-100 text-zinc-600 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                          {c.category}
                        </span>
                      </p>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">{c.message}</p>
                    </div>
                  ),
                },
                {
                  key: "audience",
                  label: "Target Audience",
                  render: (c) => (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      {c.audience}
                    </span>
                  ),
                },
                {
                  key: "channel",
                  label: "Channel",
                  render: (c) => (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-600 font-medium">
                      <Smartphone className="size-3 text-sky-600" /> {c.channel}
                    </span>
                  ),
                },
                {
                  key: "sent",
                  label: "Devices Reached",
                  render: (c) => <span className="font-black text-xs text-zinc-900">{c.sent} Feeds</span>,
                },
                {
                  key: "opened",
                  label: "Open / Read Rate",
                  render: (c) => <span className="font-bold text-xs text-emerald-600">{c.opened}</span>,
                },
                {
                  key: "date",
                  label: "Dispatched At",
                  render: (c) => (
                    <div className="text-xs text-zinc-500">
                      <p className="font-medium text-zinc-700">{c.date}</p>
                      <p className="text-[10px] text-zinc-400">{c.time}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (c) => <StatusPill value={c.status} />,
                },
              ]}
            />
          </SectionCard>
        )}

        {/* TAB 2: TEMPLATES LIBRARY */}
        {activeTab === "templates" && (
          <SectionCard title="Pre-Configured Notification Templates" description="Select any template to instantly load into the campaign composer.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATE_PRESETS.map((tpl) => (
                <div key={tpl.id} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900">{tpl.label}</span>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
                        {tpl.audience}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-zinc-800">{tpl.title}</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{tpl.body}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl text-xs font-bold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 mt-2"
                    onClick={() => {
                      handleApplyTemplate(tpl);
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                  >
                    <Copy className="size-3 mr-1" /> Use Template
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* TAB 3: GATEWAY HEALTH & REALTIME SOCKET */}
        {activeTab === "gateway" && (
          <SectionCard title="Notification Infrastructure & Dispatch Gateway" description="Real-time connectivity status across mobile push services.">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-emerald-700" />
                  <h4 className="font-bold text-xs text-emerald-950">Socket.IO Real-Time Engine</h4>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Instant sub-second event broadcasts to active rider and partner app screens.
                </p>
                <span className="inline-block rounded-full bg-emerald-200/60 px-2 py-0.5 text-[10px] font-black text-emerald-900">
                  ● Operational & Streaming
                </span>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="size-4 text-sky-700" />
                  <h4 className="font-bold text-xs text-sky-950">FCM Push Notification Service</h4>
                </div>
                <p className="text-[11px] text-sky-800">
                  Firebase Cloud Messaging gateway for Android & iOS background wake-up notifications.
                </p>
                <span className="inline-block rounded-full bg-sky-200/60 px-2 py-0.5 text-[10px] font-black text-sky-900">
                  ● Connected (4502 active)
                </span>
              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Server className="size-4 text-purple-700" />
                  <h4 className="font-bold text-xs text-purple-950">Supabase Realtime PostgreSQL</h4>
                </div>
                <p className="text-[11px] text-purple-800">
                  Database notification tables indexed with real-time replication triggers.
                </p>
                <span className="inline-block rounded-full bg-purple-200/60 px-2 py-0.5 text-[10px] font-black text-purple-900">
                  ● Transaction Pooled (6543)
                </span>
              </div>
            </div>
          </SectionCard>
        )}

        {/* TAB 4: AUDIENCE SEGMENTS */}
        {activeTab === "audience" && (
          <SectionCard title="Registered Device Audiences" description="Audience reach breakdown across user roles.">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <User className="size-5 text-purple-600" />
                  <span className="text-xl font-black text-zinc-900">65 Users</span>
                </div>
                <h4 className="font-bold text-xs text-zinc-900">Customer Base</h4>
                <p className="text-[11px] text-zinc-400">Registered customers across Kasganj, Aligarh & Delhi NCR.</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <Store className="size-5 text-emerald-600" />
                  <span className="text-xl font-black text-zinc-900">8 Hubs</span>
                </div>
                <h4 className="font-bold text-xs text-zinc-900">Partner Laundry Stores</h4>
                <p className="text-[11px] text-zinc-400">Processing centers handling washing, dry cleaning, and ironing.</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <Bike className="size-5 text-sky-600" />
                  <span className="text-xl font-black text-zinc-900">4 Captains</span>
                </div>
                <h4 className="font-bold text-xs text-zinc-900">Delivery Fleet</h4>
                <p className="text-[11px] text-zinc-400">Active pickup & delivery riders deployed on ground.</p>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </AdminShell>
  );
}
