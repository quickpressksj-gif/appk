import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Tag,
  Percent,
  Gift,
  Search,
  Download,
  Calendar,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import {
  createCoupon,
  fetchCoupons,
  fetchReferralSettings,
  fetchReferralStats,
  fetchReferralsList,
  updateReferralSettings,
  type ReferralProgramSettings,
} from "../api/coupons";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/coupons")({
  beforeLoad: requireAdminSession,
  head: () =>
    adminHead(
      "Coupons & Referral Engine",
      "Create promo codes and configure customer referral discount offers."
    ),
  component: CouponsPage,
});

export function CouponsPage() {
  const queryClient = useQueryClient();
  const coupons = useQuery({ queryKey: ["admin", "coupons"], queryFn: fetchCoupons });
  const refSettings = useQuery({
    queryKey: ["admin", "referral-settings"],
    queryFn: fetchReferralSettings,
  });
  const refStats = useQuery({
    queryKey: ["admin", "referral-stats"],
    queryFn: fetchReferralStats,
  });
  const refList = useQuery({
    queryKey: ["admin", "referral-list"],
    queryFn: fetchReferralsList,
  });

  const [activeTab, setActiveTab] = useState("coupons");
  const [searchQuery, setSearchQuery] = useState("");

  const allCoupons = coupons.data ?? [];
  const settingsData = refSettings.data;
  const statsData = refStats.data;
  const referralsList = refList.data?.items ?? [];

  const metrics = useMemo(() => {
    const total = allCoupons.length;
    const active = allCoupons.filter((c) => c.status === "Active").length;
    const totalRedemptions = allCoupons.reduce((sum, c) => sum + (c.used || 0), 0);
    const referralConversions = statsData?.convertedFirstOrders ?? 0;
    return { total, active, totalRedemptions, referralConversions };
  }, [allCoupons, statsData]);

  const filteredCoupons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCoupons.filter((c) => {
      return !q || [c.code, c.value, c.audience, c.description].join(" ").toLowerCase().includes(q);
    });
  }, [allCoupons, searchQuery]);

  const handleExportCSV = () => {
    if (filteredCoupons.length === 0) {
      toast.error("No coupons to export.");
      return;
    }
    const headers = ["Coupon Code", "Discount Value", "Minimum Order", "Audience", "Redemptions", "Expiry", "Status"];
    const csvRows = [headers.join(",")];
    for (const c of filteredCoupons) {
      csvRows.push(
        [
          `"${c.code}"`,
          `"${c.value}"`,
          `"${c.minOrder}"`,
          `"${c.audience}"`,
          `"${c.used}"`,
          `"${c.expiry}"`,
          `"${c.status}"`,
        ].join(",")
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Coupons_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Coupons list exported successfully!");
  };

  return (
    <AdminShell
      title="Coupons & Referral Engine"
      subtitle="Manage promo codes, welcome incentives, and dynamic 50% referral program rules."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95 shadow-xs"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </button>
          <CreateCouponDialog />
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "tot-coup",
              label: "Total Coupons Created",
              value: metrics.total.toLocaleString("en-IN"),
              hint: `${metrics.active} currently live & active`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "act-promos",
              label: "Active Promo Codes",
              value: metrics.active.toLocaleString("en-IN"),
              hint: "Redeemable at customer checkout",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "redemptions",
              label: "Total Redemptions",
              value: metrics.totalRedemptions.toLocaleString("en-IN"),
              hint: "Customer order usages",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "loyalty-prog",
              label: "Referral 1st Order Conversions",
              value: metrics.referralConversions.toLocaleString("en-IN"),
              hint: `₹${(statsData?.totalRewardsPaid ?? 0).toLocaleString("en-IN")} rewards disbursed`,
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. MAIN TABS
        ========================================================================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-zinc-100 p-1 rounded-xl">
            <TabsTrigger
              value="coupons"
              className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs"
            >
              Coupon Codes ({allCoupons.length})
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs"
            >
              Referral Program & Offers (50% OFF)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: COUPONS */}
          <TabsContent value="coupons" className="space-y-4">
            <SectionCard>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search promo code, discount value, or target audience..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Active Platform Promo Codes"
              description="Discount codes that customers can apply directly in their shopping cart."
            >
              <DataTable
                loading={coupons.isLoading}
                rows={filteredCoupons}
                emptyMessage="No coupons match the search query."
                columns={[
                  {
                    key: "code",
                    label: "Coupon Code",
                    render: (r) => (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/80 px-2.5 py-1 font-mono text-xs font-black text-emerald-800">
                          <Tag className="size-3 text-emerald-600" />
                          <span>{r.code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(r.code);
                            toast.success(`Copied ${r.code} to clipboard!`);
                          }}
                          className="text-zinc-400 hover:text-zinc-700"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    ),
                  },
                  {
                    key: "value",
                    label: "Discount Value",
                    render: (r) => (
                      <span className="font-bold text-xs text-zinc-900 flex items-center gap-1">
                        <Percent className="size-3 text-emerald-600" />
                        {r.value}
                      </span>
                    ),
                  },
                  {
                    key: "minOrder",
                    label: "Min Order Req",
                    render: (r) => (
                      <span className="font-mono text-xs text-zinc-700 font-semibold">
                        {r.minOrder}
                      </span>
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
                    key: "used",
                    label: "Redemptions",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-800">
                        {r.used} used
                      </span>
                    ),
                  },
                  {
                    key: "expiry",
                    label: "Expiry Date",
                    render: (r) => (
                      <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                        <Calendar className="size-3 text-zinc-400" />
                        {r.expiry}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* TAB 2: REFERRALS & LOYALTY */}
          <TabsContent value="referrals" className="space-y-6">
            {/* 1. Live Referral Settings Manager */}
            {settingsData ? (
              <ReferralSettingsForm
                initialSettings={settingsData}
                onSaved={() => {
                  queryClient.invalidateQueries({ queryKey: ["admin", "referral-settings"] });
                  queryClient.invalidateQueries({ queryKey: ["admin", "referral-stats"] });
                }}
              />
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">Loading referral settings...</div>
            )}

            {/* 2. Referral Conversions Data Table */}
            <SectionCard
              title="Referral Conversions & Rewards History"
              description="Track customers who joined with a friend's referral code and their 1st order reward payouts."
            >
              <DataTable
                loading={refList.isLoading}
                rows={referralsList}
                emptyMessage="No referral signups recorded yet."
                columns={[
                  {
                    key: "code",
                    label: "Referral Code",
                    render: (r) => (
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Gift className="size-3 text-emerald-600" />
                        <span>{r.code}</span>
                      </div>
                    ),
                  },
                  {
                    key: "referee",
                    label: "Referred Friend (New Customer)",
                    render: (r) => (
                      <div>
                        <p className="font-bold text-xs text-zinc-900">{r.refereeName}</p>
                        <p className="text-[11px] text-zinc-500">{r.refereePhone}</p>
                      </div>
                    ),
                  },
                  {
                    key: "referrer",
                    label: "Referrer (Inviter)",
                    render: (r) => (
                      <div>
                        <p className="font-bold text-xs text-zinc-900">{r.referrerName}</p>
                        <p className="text-[11px] text-zinc-500">{r.referrerPhone}</p>
                      </div>
                    ),
                  },
                  {
                    key: "offerApplied",
                    label: "1st Order Discount",
                    render: (r) => (
                      <span className="font-bold text-xs text-emerald-700">
                        Up to ₹{r.discountApplied} OFF
                      </span>
                    ),
                  },
                  {
                    key: "rewardStatus",
                    label: "Referrer Reward",
                    render: (r) => (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-zinc-900">₹{r.rewardAmount}</span>
                        <StatusPill value={r.status === "completed" ? "Completed" : "Pending 1st Delivery"} />
                      </div>
                    ),
                  },
                  {
                    key: "createdAt",
                    label: "Signup Date",
                    render: (r) => (
                      <span className="text-xs text-zinc-500">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
                      </span>
                    ),
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

function ReferralSettingsForm({
  initialSettings,
  onSaved,
}: {
  initialSettings: ReferralProgramSettings;
  onSaved: () => void;
}) {
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [discountPercent, setDiscountPercent] = useState(String(initialSettings.refereeDiscountPercent));
  const [maxDiscount, setMaxDiscount] = useState(String(initialSettings.refereeMaxDiscount));
  const [minOrderValue, setMinOrderValue] = useState(String(initialSettings.refereeMinOrderValue));
  const [referrerReward, setReferrerReward] = useState(String(initialSettings.referrerRewardAmount));
  const [headline, setHeadline] = useState(initialSettings.headline);
  const [subheadline, setSubheadline] = useState(initialSettings.subheadline);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateReferralSettings({
        enabled,
        refereeDiscountPercent: Number(discountPercent) || 50,
        refereeMaxDiscount: Number(maxDiscount) || 150,
        refereeMinOrderValue: Number(minOrderValue) || 199,
        referrerRewardAmount: Number(referrerReward) || 150,
        headline,
        subheadline,
      }),
    onSuccess: () => {
      toast.success("Referral Program & 50% Offer Rules Updated Live!");
      onSaved();
    },
    onError: () => {
      toast.error("Failed to update referral settings.");
    },
  });

  return (
    <SectionCard
      title="Referral Program Configuration & Live Offer Rules"
      description="Control the welcome discount for newly referred customers and the wallet bonus credited to referrers."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Status Toggle Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"}`}>
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">
                Referral Program Status:{" "}
                <span className={enabled ? "text-emerald-600 font-black" : "text-amber-600 font-black"}>
                  {enabled ? "ACTIVE (Live for all customers)" : "PAUSED"}
                </span>
              </p>
              <p className="text-xs text-zinc-500">
                {enabled
                  ? "New users signing up with a referral code automatically unlock the 1st order discount."
                  : "Referral code applications and reward earnings are currently disabled."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
              enabled
                ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {enabled ? "Pause Referral Program" : "Activate Referral Program"}
          </button>
        </div>

        {/* 2-Column Rules Configuration */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Column A: Referee First Order Welcome Discount */}
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
            <div className="flex items-center gap-2 text-emerald-800">
              <Gift className="size-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                1. Referee (New Customer) First Order Offer
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-zinc-700">Discount Percent (%)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="h-10 bg-white font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-zinc-700">Max Discount Cap (₹)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="1"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="h-10 bg-white pl-7 font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-zinc-700">Minimum Order Value Required (₹)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  ₹
                </span>
                <Input
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  className="h-10 bg-white pl-7 font-bold"
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Discount only applies if cart subtotal is at least ₹{minOrderValue}.
              </p>
            </div>
          </div>

          {/* Column B: Referrer Wallet Reward */}
          <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/30 p-5">
            <div className="flex items-center gap-2 text-blue-800">
              <Users className="size-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                2. Referrer (Inviting Friend) Reward Payout
              </h4>
            </div>

            <div>
              <Label className="text-xs font-bold text-zinc-700">
                Wallet Reward Amount (₹) Credited Upon 1st Delivery
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  ₹
                </span>
                <Input
                  type="number"
                  min="1"
                  value={referrerReward}
                  onChange={(e) => setReferrerReward(e.target.value)}
                  className="h-10 bg-white pl-7 font-bold"
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Instantly credited to inviter's QuickPress wallet as soon as friend's 1st order is DELIVERED.
              </p>
            </div>

            <div>
              <Label className="text-xs font-bold text-zinc-700">Reward Payout Rail</Label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-900">
                  <CheckCircle2 className="size-4 text-blue-600" />
                  <span>Direct QuickPress Wallet Balance (INR)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Copy Controls */}
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
          <Label className="text-xs font-bold text-zinc-700">Customer Share Banner Headline</Label>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="h-10 font-bold"
            placeholder="Invite Friends & Earn ₹150"
          />

          <Label className="text-xs font-bold text-zinc-700">Customer Share Sub-headline & Tagline</Label>
          <Input
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            className="h-10"
            placeholder="Friends get 50% OFF on their 1st order. You get ₹150 wallet cash."
          />
        </div>

        {/* Save Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {saveMutation.isPending ? "Saving changes..." : "Save Referral Program Rules"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function CreateCouponDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("₹199");
  const [expiry, setExpiry] = useState("31 Dec 2026");
  const [audience, setAudience] = useState("All customers");

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        code: code.trim().toUpperCase(),
        value,
        minOrder,
        expiry,
      }),
    onSuccess: () => {
      toast.success(`Promo code "${code.toUpperCase()}" launched successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setOpen(false);
      setCode("");
      setValue("");
    },
    onError: () => {
      toast.error("Failed to create coupon code.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>New Coupon</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-zinc-900">Create Promo Coupon</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 font-medium">
            Discount codes apply automatically when customer enters promo code at checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Coupon Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MONSOON50, FESTIVE100, QUICKCLEAN"
              className="h-10 rounded-xl text-xs font-mono font-bold uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Discount Benefit</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 30% OFF or ₹150 OFF"
                className="h-10 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Min Order Requirement</Label>
              <Input
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="e.g. ₹299"
                className="h-10 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Expiry Date</Label>
              <Input
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="e.g. 31 Dec 2026"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Target Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All customers">All Customers</SelectItem>
                  <SelectItem value="First order only">First Order Only</SelectItem>
                  <SelectItem value="Premium users">Premium Repeat Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-xl text-xs font-bold" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
            disabled={!code.trim() || !value.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Create Coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
