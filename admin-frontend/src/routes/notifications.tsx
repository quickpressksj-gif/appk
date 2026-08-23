import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Bell,
  Radio,
  Users,
  Building2,
  Truck,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { fetchCampaigns, sendBroadcast, type Campaign } from "../api/notifications";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Broadcast Notifications", "Send system announcements and in-app alerts to users."),
  component: NotificationsPage,
});

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const campaigns = useQuery({ queryKey: ["admin", "campaigns"], queryFn: fetchCampaigns });
  const [form, setForm] = useState({ title: "", body: "", audience: "Customers", channel: "In-app" });

  const allCampaigns = campaigns.data ?? [];

  const sendMutation = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: (data) => {
      toast.success("Broadcast message sent successfully to active devices!");
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

  return (
    <AdminShell
      title="Broadcast Notifications & Alerts"
      subtitle="Dispatch live system announcements, maintenance alerts, and offers to customers, partners, and riders."
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "tot-notif",
              label: "Total Broadcasts Sent",
              value: metrics.total.toLocaleString("en-IN"),
              hint: "Delivered to device notification centers",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "cust-alerts",
              label: "Customer Announcements",
              value: metrics.customerCampaigns.toLocaleString("en-IN"),
              hint: "Promos, order alerts and policy updates",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "part-alerts",
              label: "Partner Store Bulletins",
              value: metrics.partnerCampaigns.toLocaleString("en-IN"),
              hint: "Fulfillment SLA and payout notices",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "rdr-alerts",
              label: "Rider Fleet Dispatches",
              value: metrics.riderCampaigns.toLocaleString("en-IN"),
              hint: "Surge incentives and area advisories",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. COMPOSE & BROADCAST FEED
        ========================================================================= */}
        <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
          {/* Compose Form */}
          <SectionCard
            title="Compose System Broadcast"
            description="Broadcasts appear immediately in the notification feed of target users"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Notification Title</Label>
                <Input
                  value={form.title}
                  placeholder="e.g. Monsoon Express Laundry Is Now Live!"
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Message Content</Label>
                <Textarea
                  rows={4}
                  value={form.body}
                  placeholder="Type the announcement details or promotional instructions..."
                  onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                  className="rounded-xl text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Target Audience</Label>
                  <Select value={form.audience} onValueChange={(v) => setForm((p) => ({ ...p, audience: v }))}>
                    <SelectTrigger className="h-10 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Users</SelectItem>
                      <SelectItem value="Customers">Customers</SelectItem>
                      <SelectItem value="Partners">Partner Stores</SelectItem>
                      <SelectItem value="Riders">Delivery Fleet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">Channel</Label>
                  <Select value="In-app">
                    <SelectTrigger className="h-10 rounded-xl text-xs">
                      <SelectValue placeholder="In-app Notification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In-app">In-App Feed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white mt-2"
                disabled={sendMutation.isPending || !form.title.trim() || !form.body.trim()}
                onClick={() => {
                  if (!form.title || !form.body) {
                    toast.error("Please provide both a title and message content.");
                    return;
                  }
                  sendMutation.mutate(form);
                }}
              >
                <Send className="mr-2 size-3.5" />
                <span>Transmit Broadcast Now</span>
              </Button>
            </div>
          </SectionCard>

          {/* Past Broadcast History */}
          <SectionCard
            title="Broadcast Transmission Log"
            description="History of all platform announcements and audience reach"
          >
            <DataTable
              loading={campaigns.isLoading}
              rows={allCampaigns}
              emptyMessage="No broadcast campaigns sent yet."
              columns={[
                {
                  key: "title",
                  label: "Broadcast Title",
                  render: (r) => (
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                        <Bell className="size-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-xs">{r.title}</p>
                        <p className="text-[10px] text-zinc-400 font-medium line-clamp-1">{r.message}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "audience",
                  label: "Target Audience",
                  render: (r) => (
                    <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                      {r.audience}
                    </span>
                  ),
                },
                {
                  key: "sent",
                  label: "Transmitted On",
                  render: (r) => (
                    <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="size-3 text-zinc-400" />
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
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
