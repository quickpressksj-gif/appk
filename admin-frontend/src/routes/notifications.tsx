import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill } from "../components/AdminUI";
import { fetchCampaigns, sendBroadcast } from "../api/notifications";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Notifications", "Broadcast in-app notifications to QuickPress users."),
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();
  const campaigns = useQuery({ queryKey: ["admin", "campaigns"], queryFn: fetchCampaigns });
  const [form, setForm] = useState({ title: "", body: "", audience: "Customers", channel: "Push" });

  const send = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: () => {
      toast.success("Broadcast queued");
      setForm({ title: "", body: "", audience: "Customers", channel: "Push" });
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    },
  });

  return (
    <AdminShell title="Notifications" subtitle="Broadcasts create in-app notifications only — push and SMS are not connected yet.">
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SectionCard title="New broadcast" description="Delivered as an in-app notification only (no push/SMS/email)">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                placeholder="Monsoon offer is live"
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={5}
                value={form.body}
                placeholder="Flat 30% off on wash & fold this week."
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm((p) => ({ ...p, audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Customers", "Partners", "Riders", "All"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value="In-app" disabled>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-app">In-app</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Push, SMS and email are not wired up yet.</p>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={send.isPending}
              onClick={() => {
                if (!form.title || !form.body) {
                  toast.error("Add a title and message");
                  return;
                }
                send.mutate(form);
              }}
            >
              <Send className="mr-2 h-4 w-4" /> Send broadcast
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Campaign history" description="Delivery and open rates by campaign">
          <DataTable
            loading={campaigns.isLoading}
            rows={campaigns.data ?? []}
            columns={[
              { key: "title", label: "Campaign" },
              { key: "audience", label: "Audience" },
              { key: "channel", label: "Channel" },
              { key: "sent", label: "Sent" },
              { key: "opened", label: "Opened" },
              { key: "date", label: "Date" },
              { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
            ]}
          />
        </SectionCard>
      </div>
    </AdminShell>
  );
}
