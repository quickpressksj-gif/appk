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
  const [draft, setDraft] = useState<AdminSettings | null>(null);

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
              id: "s-gst",
              label: "GST Tax Rate",
              value: (draft?.finance as any)?.gstPercent || "5%",
              hint: "Calculated on service taxable value",
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

          {GROUPS.map((group) => (
            <TabsContent key={group.key} value={group.key}>
              <SectionCard
                title={group.label}
                description="Live configuration parameters stored in the database and enforced in real time."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  {Object.entries(draft?.[group.key] ?? {}).map(([field, value]) => {
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
                                ? { ...prev, [group.key]: { ...prev[group.key], [field]: e.target.value } }
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
        </Tabs>
      </div>
    </AdminShell>
  );
}
