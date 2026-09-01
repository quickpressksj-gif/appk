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
  Truck,
  CreditCard,
  Bell,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Server,
  Clock,
  Key,
  Smartphone,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Switch } from "@/shared/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { SectionCard, KpiCard, StatusPill } from "../components/AdminUI";
import {
  changeAdminPin,
  fetchSecurityEvents,
  fetchSettings,
  saveSettings,
  unlockClientIp,
  type AdminSettings,
} from "../api/settings";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAdminSession,
  head: () =>
    adminHead(
      "Platform & Business Settings",
      "Configure nationwide pricing rules, commissions, payment gateways, and operational parameters."
    ),
  component: SettingsPage,
});

export function SettingsPage() {
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: fetchSettings });
  const securityEvents = useQuery({ queryKey: ["admin", "security-events"], queryFn: fetchSecurityEvents });

  const [draft, setDraft] = useState<AdminSettings | null>(null);
  const [activeTab, setActiveTab] = useState<string>("platform");

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
      toast.success("Platform settings saved and propagated to all applications! 🎉");
      settings.refetch();
    },
    onError: () => {
      toast.error("Failed to persist settings.");
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      if (newPin !== confirmPin) throw new Error("New Passcode and Confirm Passcode do not match.");
      if (newPin.length < 4) throw new Error("Passcode must be at least 4 digits.");
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

  if (!draft) {
    return (
      <AdminShell title="Platform & Business Settings" subtitle="Loading platform settings...">
        <div className="py-20 text-center text-xs text-zinc-400">Loading settings from database...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Platform & Business Settings"
      subtitle="Centralized platform configuration engine. Changes dynamically propagate to Customer Checkout, Partner Pricing, and Fleet Operations."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
            onClick={() => {
              if (settings.data) setDraft(structuredClone(settings.data));
              toast.info("Reset form to saved values");
            }}
          >
            <RotateCcw className="size-3.5 mr-1" /> Reset
          </Button>

          <Button
            size="sm"
            className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 shadow-xs"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(draft)}
          >
            <Save className="mr-1.5 size-3.5" />
            <span>{saveMutation.isPending ? "Saving..." : "Save Changes"}</span>
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
              id: "brand",
              label: "Platform Brand",
              value: draft.platform.platformName.slice(0, 14),
              hint: "Customer facing title",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "hub",
              label: "Primary Launch Hub",
              value: draft.platform.defaultCity,
              hint: "Operating market",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "comm",
              label: "Platform Commission",
              value: draft.finance.defaultCommission,
              hint: "Store deduction rate",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "gst",
              label: "Standard GST Rate",
              value: draft.finance.gstPercent,
              hint: "Laundry services tax",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "deliv",
              label: "Base Delivery Fee",
              value: `₹${draft.business.deliveryFee}`,
              hint: `Free above ₹${draft.business.freeDeliveryAbove || 499}`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "status",
              label: "System Status",
              value: draft.business.maintenanceMode ? "Maintenance" : "● Operational",
              hint: draft.business.maintenanceMode ? "Customer app paused" : "All Gateways Live",
              positive: !draft.business.maintenanceMode,
            }}
          />
        </div>

        {/* =========================================================================
            2. GROUPED SETTINGS TABS
        ========================================================================= */}
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="platform" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🏢 Brand Profile
                </TabsTrigger>
                <TabsTrigger value="logistics" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🚚 Logistics & Delivery Fees
                </TabsTrigger>
                <TabsTrigger value="finance" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  💰 Taxes & Commission
                </TabsTrigger>
                <TabsTrigger value="integrations" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🔌 Payment & API Gateways
                </TabsTrigger>
                <TabsTrigger value="operations" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  ⚙️ Operations & Maintenance
                </TabsTrigger>
                <TabsTrigger value="security" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🛡️ Security & Passcode
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Sparkles className="size-4 text-emerald-600" />
              <span>Real-Time Database Sync</span>
            </div>
          </div>

          {/* =====================================================================
              TAB 1: BRAND PROFILE & CONTACT CHANNELS
          ===================================================================== */}
          {activeTab === "platform" && (
            <div className="pt-4 space-y-4 max-w-4xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Platform Brand Name</Label>
                  <Input
                    value={draft.platform.platformName}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, platform: { ...p.platform, platformName: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Customer and partner facing application title</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Brand Tagline / Slogan</Label>
                  <Input
                    value={draft.platform.tagline || ""}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, platform: { ...p.platform, tagline: e.target.value } } : null))
                    }
                    className="h-10 text-xs"
                  />
                  <p className="text-[10px] text-zinc-400">Displayed in hero banners and meta tags</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Official Support Email</Label>
                  <Input
                    value={draft.platform.supportEmail}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, platform: { ...p.platform, supportEmail: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-400">Escalation and ticket communication email</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Support Helpline Number</Label>
                  <Input
                    value={draft.platform.supportPhone}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, platform: { ...p.platform, supportPhone: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-400">Displayed on customer booking invoices</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Primary Launch City Hub</Label>
                  <Input
                    value={draft.platform.defaultCity}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, platform: { ...p.platform, defaultCity: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Default market for unlocalized visitors</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Platform Currency</Label>
                  <Input
                    value={draft.platform.currency}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, platform: { ...p.platform, currency: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Standard Operating Hours</Label>
                  <Input
                    value={draft.platform.operatingHours || "08:00 AM - 09:00 PM (Mon-Sun)"}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, platform: { ...p.platform, operatingHours: e.target.value } } : null))
                    }
                    className="h-10 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: LOGISTICS, DELIVERY FEES & THRESHOLDS
          ===================================================================== */}
          {activeTab === "logistics" && (
            <div className="pt-4 space-y-4 max-w-4xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Minimum Order Checkout Amount (₹)</Label>
                  <Input
                    type="number"
                    value={draft.business.minimumOrderValue}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, business: { ...p.business, minimumOrderValue: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Cart subtotal threshold required to place a wash order</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Standard Doorstep Delivery Fee (₹)</Label>
                  <Input
                    type="number"
                    value={draft.business.deliveryFee}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, business: { ...p.business, deliveryFee: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Base logistics fee added to customer carts below free threshold</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Free Delivery Threshold (₹)</Label>
                  <Input
                    type="number"
                    value={draft.business.freeDeliveryAbove || "499"}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, business: { ...p.business, freeDeliveryAbove: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Orders exceeding this cart value receive 100% free delivery</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Express Packaging & Handling Fee (₹)</Label>
                  <Input
                    type="number"
                    value={draft.business.handlingFee}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, business: { ...p.business, handlingFee: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Order sanitization and garment protective bag fee</p>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: TAXES, COMMISSION & PARTNER ESCROW
          ===================================================================== */}
          {activeTab === "finance" && (
            <div className="pt-4 space-y-4 max-w-4xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Standard GST Rate (%)</Label>
                  <Input
                    value={draft.finance.gstPercent}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, finance: { ...p.finance, gstPercent: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">e.g. 5% applied on laundry services nationwide</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">QuickPress Partner Commission Rate (%)</Label>
                  <Input
                    value={draft.finance.defaultCommission}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, finance: { ...p.finance, defaultCommission: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Standard platform commission deducted on partner wash completion</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Delivery Rider Payout Allocation</Label>
                  <Input
                    value={draft.finance.riderCommission}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, finance: { ...p.finance, riderCommission: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-medium"
                  />
                  <p className="text-[10px] text-zinc-400">Formula for delivery captain trip settlement</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Partner Settlement Payout Cycle</Label>
                  <Select
                    value={draft.business.payoutCycle}
                    onValueChange={(v) =>
                      setDraft((p) => (p ? { ...p, business: { ...p.business, payoutCycle: v } } : null))
                    }
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly on Monday">Weekly on Monday</SelectItem>
                      <SelectItem value="Bi-weekly (1st & 16th)">Bi-weekly (1st & 16th)</SelectItem>
                      <SelectItem value="Daily Automated Settlement">Daily Automated Settlement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Registered Legal Business Entity</Label>
                  <Input
                    value={draft.business.legalName}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, business: { ...p.business, legalName: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">15-Digit GSTIN Number</Label>
                  <Input
                    value={draft.business.gstin}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, business: { ...p.business, gstin: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Headquarters Operating Address</Label>
                <Textarea
                  rows={2}
                  value={draft.business.address}
                  onChange={(e) =>
                    setDraft((p) => (p ? { ...p, business: { ...p.business, address: e.target.value } } : null))
                  }
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: PAYMENT GATEWAYS & API INTEGRATIONS
          ===================================================================== */}
          {activeTab === "integrations" && (
            <div className="pt-4 space-y-4 max-w-4xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Payment Gateway Provider</Label>
                  <Input
                    value={draft.integrations.paymentGateway}
                    onChange={(e) =>
                      setDraft((p) =>
                        p ? { ...p, integrations: { ...p.integrations, paymentGateway: e.target.value } } : null
                      )
                    }
                    className="h-10 text-xs font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Razorpay Live / Cashfree UPI / Stripe</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Payment Gateway Key ID / Merchant ID</Label>
                  <Input
                    value={draft.integrations.paymentKeyId}
                    onChange={(e) =>
                      setDraft((p) =>
                        p ? { ...p, integrations: { ...p.integrations, paymentKeyId: e.target.value } } : null
                      )
                    }
                    className="h-10 text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-400">Production merchant key for UPI collection</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Google Maps Platform API Key</Label>
                  <Input
                    value={draft.integrations.googleMapsKey}
                    onChange={(e) =>
                      setDraft((p) =>
                        p ? { ...p, integrations: { ...p.integrations, googleMapsKey: e.target.value } } : null
                      )
                    }
                    className="h-10 text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-400">Distance matrix & address geocoding key</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Firebase Cloud Project ID</Label>
                  <Input
                    value={draft.integrations.firebaseProject}
                    onChange={(e) =>
                      setDraft((p) =>
                        p ? { ...p, integrations: { ...p.integrations, firebaseProject: e.target.value } } : null
                      )
                    }
                    className="h-10 text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-400">FCM Push token registry & Google Auth</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">SMS Gateway Provider</Label>
                  <Input
                    value={draft.integrations.smsProvider}
                    onChange={(e) =>
                      setDraft((p) =>
                        p ? { ...p, integrations: { ...p.integrations, smsProvider: e.target.value } } : null
                      )
                    }
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">DLT Registered 6-Char Sender ID</Label>
                  <Input
                    value={draft.integrations.smsSenderId}
                    onChange={(e) =>
                      setDraft((p) =>
                        p ? { ...p, integrations: { ...p.integrations, smsSenderId: e.target.value } } : null
                      )
                    }
                    className="h-10 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 5: OPERATIONS & MAINTENANCE MODE
          ===================================================================== */}
          {activeTab === "operations" && (
            <div className="pt-4 space-y-6 max-w-4xl">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                      <AlertTriangle className="size-4 text-amber-600" /> Emergency Platform Maintenance Mode
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Temporarily pause customer order placement for server updates or monsoon emergency.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(draft.business.maintenanceMode)}
                    onCheckedChange={(checked) =>
                      setDraft((p) =>
                        p ? { ...p, business: { ...p.business, maintenanceMode: checked } } : null
                      )
                    }
                  />
                </div>

                {draft.business.maintenanceMode && (
                  <div className="pt-3 border-t border-zinc-100 space-y-1.5">
                    <Label className="text-xs font-bold text-amber-800">Customer Maintenance Notice Banner</Label>
                    <Textarea
                      rows={2}
                      value={draft.business.maintenanceMessage || ""}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, business: { ...p.business, maintenanceMessage: e.target.value } } : null
                        )
                      }
                      className="text-xs border-amber-300 bg-amber-50/50"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex items-center justify-between shadow-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-zinc-900">Partner Store Self-Registration</h4>
                  <p className="text-[11px] text-zinc-400">
                    Allow new laundry stores and dry cleaners to submit onboarding applications.
                  </p>
                </div>
                <Switch
                  checked={draft.business.partnerRegistrationEnabled !== false}
                  onCheckedChange={(checked) =>
                    setDraft((p) =>
                      p ? { ...p, business: { ...p.business, partnerRegistrationEnabled: checked } } : null
                    )
                  }
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 6: SECURITY & PASSCODE
          ===================================================================== */}
          {activeTab === "security" && (
            <div className="pt-4 space-y-6 max-w-4xl">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                    <Lock className="size-4 text-emerald-600" /> Change Master Admin Security Passcode (PIN)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Update the 4-digit security PIN used for critical actions and financial payouts.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Current Passcode</Label>
                    <Input
                      type="password"
                      maxLength={6}
                      placeholder="••••"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">New Passcode</Label>
                    <Input
                      type="password"
                      maxLength={6}
                      placeholder="••••"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Confirm Passcode</Label>
                    <Input
                      type="password"
                      maxLength={6}
                      placeholder="••••"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="h-10 text-xs font-mono"
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => pinMutation.mutate()}
                  disabled={!currentPin || !newPin || !confirmPin || pinMutation.isPending}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 shadow-xs"
                >
                  <Key className="size-3.5 mr-1.5" />
                  {pinMutation.isPending ? "Updating..." : "Update Master Passcode"}
                </Button>
              </div>

              {/* Security Events Timeline */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 shadow-xs">
                <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600" /> Recent Security & Authentication Events
                </h4>

                <div className="divide-y divide-zinc-100 text-xs">
                  {(securityEvents.data?.events || []).map((ev, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="font-bold text-zinc-900 font-mono text-[11px]">{ev.eventType}</p>
                          <p className="text-[10px] text-zinc-400">IP: {ev.clientIp}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {ev.timestamp?.slice(0, 16).replace("T", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
