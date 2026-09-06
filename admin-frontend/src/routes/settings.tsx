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
  CloudRain,
  CalendarClock,
  Gift,
  FileText,
  ShieldAlert,
  SlidersHorizontal,
  Flame,
  Receipt,
  UserCheck,
  Award,
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
      "Configure nationwide pricing rules, monsoon surge, capacity throttle, referral limits, tax invoicing, and operational safety."
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
      toast.success("Platform settings saved and propagated across all live applications! 🎉");
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
            className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            onClick={() => {
              if (settings.data) setDraft(structuredClone(settings.data));
              toast.info("Reset form to saved values");
            }}
          >
            <RotateCcw className="size-3.5 mr-1" /> Reset
          </Button>

          <Button
            size="sm"
            className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 shadow-xs cursor-pointer"
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
              id: "surge-status",
              label: "Monsoon Surge",
              value: draft.surge.enabled ? `+₹${draft.surge.rainSurgeFee} Active` : "Inactive (Normal)",
              hint: draft.surge.enabled ? "Rain surge applied" : "Standard pricing",
              positive: !draft.surge.enabled,
            }}
          />
          <KpiCard
            kpi={{
              id: "comm",
              label: "Platform Cut",
              value: draft.finance.defaultCommission,
              hint: "Store deduction rate",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "gst",
              label: "SAC 998813 GST",
              value: draft.finance.gstPercent,
              hint: "Laundry tax rate",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "referral-reward",
              label: "Referral Reward",
              value: `₹${draft.referral.referrerReward}`,
              hint: `Max ${draft.referral.maxWalletUsagePercent}% wallet cart pay`,
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
              <TabsList className="bg-zinc-100 p-1 rounded-xl flex flex-wrap gap-1">
                <TabsTrigger value="platform" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  🏢 Brand Profile
                </TabsTrigger>
                <TabsTrigger value="logistics" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  🚚 Logistics & Fees
                </TabsTrigger>
                <TabsTrigger value="surge" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  🌧️ Monsoon & Surge
                </TabsTrigger>
                <TabsTrigger value="slots" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  ⏱️ Slots & Capacity
                </TabsTrigger>
                <TabsTrigger value="referral" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  🎁 Referral & Wallet
                </TabsTrigger>
                <TabsTrigger value="finance" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  💰 Taxes & Commission
                </TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  🧾 SAC 998813 Invoice
                </TabsTrigger>
                <TabsTrigger value="safety" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  🛡️ Fraud & Safety
                </TabsTrigger>
                <TabsTrigger value="operations" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  ⚙️ Operations Mode
                </TabsTrigger>
                <TabsTrigger value="security" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs cursor-pointer">
                  🔒 Security & PIN
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Sparkles className="size-4 text-emerald-600" />
              <span>Live Database Synchronization</span>
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
                  <p className="text-[10px] text-zinc-400">24/7 customer and delivery captain helpline</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Primary Launch Hub City</Label>
                  <Input
                    value={draft.platform.defaultCity}
                    onChange={(e) =>
                      setDraft((p) => (p ? { ...p, platform: { ...p.platform, defaultCity: e.target.value } } : null))
                    }
                    className="h-10 text-xs font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Default territory for new customer geocoding</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Currency Specification</Label>
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
              TAB 3: MONSOON & SURGE PRICING ENGINE
          ===================================================================== */}
          {activeTab === "surge" && (
            <div className="pt-4 space-y-6 max-w-4xl">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-blue-950 flex items-center gap-2">
                      <CloudRain className="size-4 text-blue-600" />
                      <span>Monsoon & Bad Weather Surcharge Toggle</span>
                    </h4>
                    <p className="text-[11px] text-blue-700">
                      When enabled, adds extra rain surge fee to compensate delivery riders during heavy rainfall.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(draft.surge.enabled)}
                    onCheckedChange={(checked) =>
                      setDraft((p) =>
                        p ? { ...p, surge: { ...p.surge, enabled: checked } } : null
                      )
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-blue-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-blue-900">Rain Surcharge Fee (₹)</Label>
                    <Input
                      type="number"
                      value={draft.surge.rainSurgeFee}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, surge: { ...p.surge, rainSurgeFee: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-blue-600">Added to customer cart when surge is active</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-blue-900">Peak Festival Surge (₹)</Label>
                    <Input
                      type="number"
                      value={draft.surge.peakSurgeFee}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, surge: { ...p.surge, peakSurgeFee: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-blue-600">High-demand rush surcharge</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-blue-900">Dynamic Rain Delay Buffer (Mins)</Label>
                    <Input
                      type="number"
                      value={draft.surge.etaDelayMinutes}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, surge: { ...p.surge, etaDelayMinutes: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-blue-600">Extra buffer advisory added to tracking ETA</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-blue-900">Customer Facing Surge Notice</Label>
                  <Input
                    value={draft.surge.surgeReason || ""}
                    onChange={(e) =>
                      setDraft((p) =>
                        p ? { ...p, surge: { ...p.surge, surgeReason: e.target.value } } : null
                      )
                    }
                    className="h-10 text-xs bg-white"
                    placeholder="e.g. Heavy rainfall in your area. Surcharge applied to support delivery captains."
                  />
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: TIME SLOTS & CAPACITY THROTTLE ENGINE
          ===================================================================== */}
          {activeTab === "slots" && (
            <div className="pt-4 space-y-4 max-w-4xl">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                    <CalendarClock className="size-4 text-emerald-600" />
                    <span>Pickup & Delivery Slot Capacity Controls</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Throttle order intake per time interval to ensure partner stores and delivery fleets are never overwhelmed.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Slot Window Duration (Hours)</Label>
                    <Select
                      value={String(draft.slots.slotDurationHours)}
                      onValueChange={(v) =>
                        setDraft((p) =>
                          p ? { ...p, slots: { ...p.slots, slotDurationHours: v } } : null
                        )
                      }
                    >
                      <SelectTrigger className="h-10 text-xs cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1-Hour Precision Windows</SelectItem>
                        <SelectItem value="2">2-Hour Standard Windows</SelectItem>
                        <SelectItem value="3">3-Hour Flexible Windows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Max Orders Intake Per Slot</Label>
                    <Input
                      type="number"
                      value={draft.slots.maxOrdersPerSlot}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, slots: { ...p.slots, maxOrdersPerSlot: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-zinc-400">Slot automatically closes when limit is reached</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Minimum Advance Lead Time (Hours)</Label>
                    <Input
                      type="number"
                      value={draft.slots.leadTimeHours}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, slots: { ...p.slots, leadTimeHours: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-zinc-400">Advance booking required prior to pickup</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <h5 className="font-bold text-xs text-zinc-900 mb-3">Turnaround Speed Pricing Multipliers</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-amber-800">⚡ Express 24-Hour Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.slots.express24hMultiplier}
                        onChange={(e) =>
                          setDraft((p) =>
                            p ? { ...p, slots: { ...p.slots, express24hMultiplier: e.target.value } } : null
                          )
                        }
                        className="h-10 text-xs font-mono font-bold"
                      />
                      <p className="text-[10px] text-zinc-400">e.g. 1.5x (50% premium for 24-hour delivery)</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-zinc-800">Standard 48-Hour Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.slots.standard48hMultiplier}
                        onChange={(e) =>
                          setDraft((p) =>
                            p ? { ...p, slots: { ...p.slots, standard48hMultiplier: e.target.value } } : null
                          )
                        }
                        className="h-10 text-xs font-mono font-bold"
                      />
                      <p className="text-[10px] text-zinc-400">1.0x baseline regular catalog rate</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-emerald-800">Economy 72-Hour Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.slots.economy72hMultiplier}
                        onChange={(e) =>
                          setDraft((p) =>
                            p ? { ...p, slots: { ...p.slots, economy72hMultiplier: e.target.value } } : null
                          )
                        }
                        className="h-10 text-xs font-mono font-bold"
                      />
                      <p className="text-[10px] text-zinc-400">e.g. 0.9x (10% discount for non-urgent washing)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 5: REFERRAL, CASHBACK & WALLET LIMITS ENGINE
          ===================================================================== */}
          {activeTab === "referral" && (
            <div className="pt-4 space-y-4 max-w-4xl">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-purple-950 flex items-center gap-2">
                      <Gift className="size-4 text-purple-600" />
                      <span>Referral Program & Signup Rewards Engine</span>
                    </h4>
                    <p className="text-[11px] text-purple-700">
                      Configure referral wallet incentives, referee signup credits, and checkout redemption boundaries.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(draft.referral.enabled)}
                    onCheckedChange={(checked) =>
                      setDraft((p) =>
                        p ? { ...p, referral: { ...p.referral, enabled: checked } } : null
                      )
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-purple-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-900">Referee Signup Welcome Credit (₹)</Label>
                    <Input
                      type="number"
                      value={draft.referral.refereeReward}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, referral: { ...p.referral, refereeReward: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-purple-600">Instant wallet credit on registering with invite code</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-900">Referrer Reward on 1st Order (₹)</Label>
                    <Input
                      type="number"
                      value={draft.referral.referrerReward}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, referral: { ...p.referral, referrerReward: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-purple-600">Paid to inviter when friend's 1st order is delivered</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-900">Max Wallet Usage per Checkout (%)</Label>
                    <Input
                      type="number"
                      value={draft.referral.maxWalletUsagePercent}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, referral: { ...p.referral, maxWalletUsagePercent: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-purple-600">e.g. Max 35% of cart subtotal can be paid from wallet</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 6: TAXES, COMMISSION & PARTNER ESCROW
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
                    <SelectTrigger className="h-10 text-xs cursor-pointer">
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
              TAB 7: AUTOMATED TAX INVOICE & SAC 998813 COMPLIANCE
          ===================================================================== */}
          {activeTab === "compliance" && (
            <div className="pt-4 space-y-4 max-w-4xl">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                    <FileText className="size-4 text-emerald-600" />
                    <span>GST Law & SAC 998813 Invoicing Compliance</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Automated B2B/B2C invoice generation adhering to Indian GST rules for Laundry & Dry Cleaning Services (SAC 998813).
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Services Accounting Code (SAC)</Label>
                    <Input
                      value={draft.compliance.sacCode}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, compliance: { ...p.compliance, sacCode: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-zinc-400">Mandatory SAC 998813 printed on all PDF receipts</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Tax Invoice Serial Prefix</Label>
                    <Input
                      value={draft.compliance.invoicePrefix}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, compliance: { ...p.compliance, invoicePrefix: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-zinc-400">e.g. QP/2026-27/0001 series</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Section 194C TDS Rate on Stores (%)</Label>
                    <Input
                      value={draft.compliance.tdsRate}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, compliance: { ...p.compliance, tdsRate: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-zinc-400">TDS deducted on partner store settlement batches</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <h5 className="font-bold text-xs text-zinc-900 mb-3">GST Component Breakdown (Intra-State vs Inter-State)</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">Central GST (CGST %)</Label>
                      <Input
                        value={draft.compliance.cgstPercent}
                        onChange={(e) =>
                          setDraft((p) =>
                            p ? { ...p, compliance: { ...p.compliance, cgstPercent: e.target.value } } : null
                          )
                        }
                        className="h-10 text-xs font-mono font-bold"
                      />
                      <p className="text-[10px] text-zinc-400">Applied for intra-state pickups</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold">State GST (SGST %)</Label>
                      <Input
                        value={draft.compliance.sgstPercent}
                        onChange={(e) =>
                          setDraft((p) =>
                            p ? { ...p, compliance: { ...p.compliance, sgstPercent: e.target.value } } : null
                          )
                        }
                        className="h-10 text-xs font-mono font-bold"
                      />
                      <p className="text-[10px] text-zinc-400">Applied for intra-state pickups</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold">Integrated GST (IGST %)</Label>
                      <Input
                        value={draft.compliance.igstPercent}
                        onChange={(e) =>
                          setDraft((p) =>
                            p ? { ...p, compliance: { ...p.compliance, igstPercent: e.target.value } } : null
                          )
                        }
                        className="h-10 text-xs font-mono font-bold"
                      />
                      <p className="text-[10px] text-zinc-400">Applied for inter-state orders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 8: FRAUD DETECTION & ORDER SAFETY ENGINE
          ===================================================================== */}
          {activeTab === "safety" && (
            <div className="pt-4 space-y-4 max-w-4xl">
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-rose-950 flex items-center gap-2">
                    <ShieldAlert className="size-4 text-rose-600" />
                    <span>Order Fraud Detection & Rider Security Rules</span>
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    Automated security rules to prevent fake orders, rider GPS spoofing, and excessive cart cancellations.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-rose-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-rose-900">High-Value Dual OTP Threshold (₹)</Label>
                    <Input
                      type="number"
                      value={draft.safety.highValueThreshold}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, safety: { ...p.safety, highValueThreshold: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-rose-600">Mandatory dual security OTP on orders exceeding this value</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-rose-900">Max Cancellation Strikes / Week</Label>
                    <Input
                      type="number"
                      value={draft.safety.maxCancellationStrikes}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, safety: { ...p.safety, maxCancellationStrikes: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-rose-600">Strikes before temporary account suspension</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-rose-900">Auto Security Lockout Period (Hours)</Label>
                    <Input
                      type="number"
                      value={draft.safety.autoLockoutHours}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, safety: { ...p.safety, autoLockoutHours: e.target.value } } : null
                        )
                      }
                      className="h-10 text-xs font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-rose-600">IP & Account cool-off duration</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-rose-200">
                  <div>
                    <h5 className="font-bold text-xs text-rose-950">Rider Mock Location / Fake GPS Guard</h5>
                    <p className="text-[10px] text-rose-700">
                      Disallow rider status updates if device reports mock/simulated GPS coordinates.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(draft.safety.mockGpsGuard)}
                    onCheckedChange={(checked) =>
                      setDraft((p) =>
                        p ? { ...p, safety: { ...p.safety, mockGpsGuard: checked } } : null
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 9: OPERATIONS & MAINTENANCE MODE
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
                      Temporarily pause customer order placement for server updates or emergency situations.
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
              TAB 10: SECURITY & PASSCODE
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
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9 px-4 shadow-xs cursor-pointer"
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
