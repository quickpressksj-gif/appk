import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Save,
  Sliders,
  Building2,
  DollarSign,
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  Sparkles,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { SectionCard, KpiCard } from "../components/AdminUI";
import { fetchSettings, saveSettings, type AdminSettings } from "../api/settings";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Platform Business Settings", "Configure nationwide pricing rules, commissions, and integrations."),
  component: SettingsPage,
});

const GROUPS = [
  { key: "business", label: "Business & Pricing Rules" },
  { key: "finance", label: "Taxes & Commission" },
  { key: "platform", label: "Platform General" },
  { key: "integrations", label: "Gateway & API Integrations" },
  { key: "security", label: "🛡️ Security & Passcode" },
] as const;

const LABELS: Record<string, { label: string; hint: string }> = {
  platformName: { label: "Platform Brand Name", hint: "Customer and partner facing application title" },
  supportEmail: { label: "Support Official Email", hint: "Escalation contact address" },
  supportPhone: { label: "Support Helpline", hint: "Displayed on booking invoices" },
  defaultCity: { label: "Primary Operations Hub", hint: "Default launch city" },
  currency: { label: "Default Currency Code", hint: "e.g. INR" },
  legalName: { label: "Registered Business Entity", hint: "Legal billing name on invoices" },
  gstin: { label: "GSTIN Identification Number", hint: "15-digit Indian Tax Identifier" },
  address: { label: "Registered Operating Address", hint: "Headquarters location" },
  payoutCycle: { label: "Partner Settlement Payout Cycle", hint: "Weekly or automated interval" },
  minimumOrderValue: { label: "Minimum Order Amount (₹)", hint: "Cart subtotal threshold required to checkout" },
  deliveryFee: { label: "Standard Delivery Fee (₹)", hint: "Base logistics charge added to cart" },
  handlingFee: { label: "Express Handling Charge (₹)", hint: "Order packaging and sanitization fee" },
  paymentGateway: { label: "Payment Gateway Provider", hint: "Razorpay / Cashfree / Stripe" },
  paymentKeyId: { label: "Payment Gateway API Key ID", hint: "Production merchant credentials" },
  firebaseProject: { label: "Firebase Project ID", hint: "Auth & Push token registry" },
  googleMapsKey: { label: "Google Maps Platform API Key", hint: "Geocoding and distance matrix calculation" },
  smsProvider: { label: "SMS Gateway Provider", hint: "Twilio or Fast2SMS" },
  smsSenderId: { label: "SMS 6-Char Sender Header", hint: "DLT-registered sender ID" },
  gstPercent: { label: "Standard GST Tax Rate", hint: "e.g. 5% applied on laundry services" },
  serviceTax: { label: "Platform Service Surcharge", hint: "Additional municipal levy if applicable" },
  defaultCommission: { label: "QuickPress Partner Commission", hint: "Standard platform deduction (e.g. 18%)" },
  riderCommission: { label: "Rider Payout Allocation", hint: "100% of delivery fee + performance bonus" },
};

export function SettingsPage() {
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: fetchSettings });
  const securityEvents = useQuery({ queryKey: ["admin", "security-events"], queryFn: fetchSecurityEvents });
  const [draft, setDraft] = useState<AdminSettings | null>(null);

  // Passcode update state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast.success("Platform settings saved and propagated to all applications!");
    },
    onError: () => {
      toast.error("Failed to persist settings.");
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      if (newPin !== confirmPin) throw new Error("New Passcode and Confirm Passcode do not match.");
      return changeAdminPin(currentPin, newPin);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Admin Security Passcode updated successfully!");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      void securityEvents.refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update passcode.");
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (ip: string) => unlockClientIp(ip),
    onSuccess: (res) => {
      toast.success(res.message);
      void securityEvents.refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unlock IP.");
    },
  });

  return (
    <AdminShell
      title="Platform & Business Settings"
      subtitle="Centralized configuration engine. Changes dynamically propagate to Customer Checkout, Partner Pricing, and Admin Operations."
      actions={
        <Button
          size="sm"
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 shadow-xs"
          disabled={!draft || saveMutation.isPending}
          onClick={() => draft && saveMutation.mutate(draft)}
        >
          <Save className="mr-1.5 size-3.5" /> Save Changes
        </Button>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "s-min-order",
              label: "Minimum Order Rule",
              value: `₹${(draft?.business as any)?.minimumOrderValue || "99"}`,
              hint: "Enforced server-side at checkout",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "s-comm",
              label: "Partner Commission Rate",
              value: (draft?.finance as any)?.defaultCommission || "18%",
              hint: "Retained by QuickPress platform",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "s-delivery",
              label: "Base Delivery Charge",
              value: `₹${(draft?.business as any)?.deliveryFee || "29"}`,
              hint: "Disbursed to assigned rider fleet",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "s-security",
              label: "Admin Security Shield",
              value: "Enterprise Active",
              hint: "Brute-force lockout & HMAC timing protection",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. GROUPED SETTINGS TABS
        ========================================================================= */}
        <Tabs defaultValue="business" className="space-y-4">
          <TabsList className="bg-zinc-100 p-1 rounded-xl">
            {GROUPS.map((group) => (
              <TabsTrigger
                key={group.key}
                value={group.key}
                className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs"
              >
                {group.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {GROUPS.filter((g) => g.key !== "security").map((group) => (
            <TabsContent key={group.key} value={group.key}>
              <SectionCard
                title={group.label}
                description="Live configuration parameters stored in the database and enforced in real time."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  {Object.entries((draft as any)?.[group.key] ?? {}).map(([field, value]) => {
                    const meta = LABELS[field] || { label: field, hint: "" };
                    return (
                      <div key={field} className="space-y-1.5 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5">
                        <Label htmlFor={field} className="text-xs font-bold text-zinc-900">
                          {meta.label}
                        </Label>
                        <Input
                          id={field}
                          value={String(value)}
                          onChange={(e) =>
                            setDraft((prev) =>
                              prev
                                ? { ...prev, [group.key]: { ...(prev as any)[group.key], [field]: e.target.value } }
                                : prev,
                            )
                          }
                          className="h-10 rounded-xl text-xs bg-white border-zinc-200 focus:bg-white font-medium"
                        />
                        {meta.hint && <p className="text-[11px] text-zinc-400 font-medium">{meta.hint}</p>}
                      </div>
                    );
                  })}
                  {settings.isLoading && <p className="text-xs text-zinc-400">Loading settings from database...</p>}
                </div>
              </SectionCard>
            </TabsContent>
          ))}

          {/* =========================================================================
              3. SECURITY & PASSCODE MANAGEMENT TAB
          ========================================================================= */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Passcode Change Form */}
              <SectionCard
                title="Change Super Admin Passcode"
                description="Update the master 4-digit PIN / security passcode used to log into the Admin Console."
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    pinMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-900">Current Admin Passcode</Label>
                    <Input
                      type="password"
                      placeholder="Enter existing PIN (default: 4502)"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="h-10 rounded-xl text-xs bg-white border-zinc-200 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-900">New Admin Passcode</Label>
                    <Input
                      type="password"
                      placeholder="Enter new 4+ digit passcode"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="h-10 rounded-xl text-xs bg-white border-zinc-200 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-900">Confirm New Passcode</Label>
                    <Input
                      type="password"
                      placeholder="Re-enter new passcode"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="h-10 rounded-xl text-xs bg-white border-zinc-200 font-medium"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!currentPin || !newPin || !confirmPin || pinMutation.isPending}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-xs"
                  >
                    <Lock className="mr-1.5 size-3.5" /> Update Admin Passcode
                  </Button>
                </form>
              </SectionCard>

              {/* Security Shield & Active Lockouts */}
              <SectionCard
                title="Brute-Force & Lockout Guard"
                description="Automated defense active: IP is locked for 15 minutes after 5 consecutive failed attempts."
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                        <ShieldCheck className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-black text-emerald-950">Active Defense Shield Enabled</p>
                        <p className="text-[11px] font-semibold text-emerald-700">
                          HMAC Constant-Time verification · 5 attempts threshold · 15m lockout
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-zinc-900">Currently Locked IP Addresses</p>
                    {securityEvents.data?.activeLockouts && securityEvents.data.activeLockouts.length > 0 ? (
                      <div className="space-y-2">
                        {securityEvents.data.activeLockouts.map((loc) => (
                          <div
                            key={loc._id}
                            className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/60 p-3 text-xs"
                          >
                            <div>
                              <p className="font-bold text-red-900">IP: {loc.ip}</p>
                              <p className="text-[10px] text-red-700">
                                {loc.failedCount} failed attempts · Last: {new Date(loc.lastAttemptAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-[11px] font-bold text-red-700 border-red-300 hover:bg-red-100"
                              onClick={() => unlockMutation.mutate(loc.ip)}
                            >
                              Unlock IP
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 text-center text-xs text-zinc-500">
                        ✨ No IP addresses currently locked out. System healthy.
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Security Audit Events Log */}
            <SectionCard
              title="Recent Security Audit Logs"
              description="Real-time timeline of Admin logins, failed passcode attempts, and system lockouts."
            >
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {securityEvents.data?.events && securityEvents.data.events.length > 0 ? (
                  securityEvents.data.events.map((ev, idx) => (
                    <div
                      key={ev._id || idx}
                      className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-2 rounded-full ${
                            ev.eventType === "SUCCESSFUL_ADMIN_LOGIN"
                              ? "bg-emerald-500"
                              : ev.eventType === "ACCOUNT_LOCKOUT"
                              ? "bg-red-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <div>
                          <p className="font-bold text-zinc-900">
                            {ev.eventType === "SUCCESSFUL_ADMIN_LOGIN"
                              ? "✅ Successful Admin Login"
                              : ev.eventType === "ACCOUNT_LOCKOUT"
                              ? "🚨 Account IP Lockout Triggered"
                              : "⚠️ Failed Passcode Attempt"}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            IP: {ev.clientIp} {ev.userAgent ? `· ${ev.userAgent.slice(0, 40)}...` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400">
                        {new Date(ev.timestamp).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-zinc-400">No security events recorded yet.</p>
                )}
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

