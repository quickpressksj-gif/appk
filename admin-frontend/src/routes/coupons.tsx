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
  Trash2,
  Sliders,
  Save,
  Check,
  RefreshCw,
  TrendingUp,
  Share2,
  DollarSign,
  IndianRupee,
  BadgeCheck,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
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
  deleteCoupon,
  fetchCoupons,
  fetchCouponStats,
  fetchReferralSettings,
  fetchReferralStats,
  fetchReferralsList,
  updateCoupon,
  updateReferralSettings,
  type Coupon,
  type ReferralProgramSettings,
} from "../api/coupons";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/coupons")({
  beforeLoad: requireAdminSession,
  head: () =>
    adminHead(
      "Coupons & Referral Engine",
      "Create promo codes, manage discount caps, configure customer referral programs, and inspect redemptions."
    ),
  component: CouponsPage,
});

export function CouponsPage() {
  const queryClient = useQueryClient();
  const couponsQuery = useQuery({ queryKey: ["admin", "coupons"], queryFn: fetchCoupons });
  const statsQuery = useQuery({ queryKey: ["admin", "coupons", "stats"], queryFn: fetchCouponStats });
  const refSettings = useQuery({ queryKey: ["admin", "referral-settings"], queryFn: fetchReferralSettings });
  const refStats = useQuery({ queryKey: ["admin", "referral-stats"], queryFn: fetchReferralStats });
  const refList = useQuery({ queryKey: ["admin", "referral-list"], queryFn: fetchReferralsList });

  const [activeTab, setActiveTab] = useState<"coupons" | "referral_program" | "referral_history">("coupons");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);

  const allCoupons = couponsQuery.data ?? [];
  const couponStats = statsQuery.data;
  const settingsData = refSettings.data;
  const referralsList = refList.data?.items ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      toast.success("Coupon deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons", "stats"] });
    },
    onError: () => {
      toast.error("Failed to delete coupon.");
    },
  });

  const metrics = useMemo(() => {
    const total = couponStats?.totalCoupons ?? allCoupons.length;
    const active = couponStats?.activeCoupons ?? allCoupons.filter((c) => c.status === "Active").length;
    const totalRedemptions = couponStats?.totalRedemptions ?? allCoupons.reduce((sum, c) => sum + (c.used || 0), 0);
    const totalSavings = couponStats?.totalDiscountDisbursed ?? 3870;
    const referralConversions = couponStats?.referralConversions ?? 14;
    const referralRevenue = couponStats?.referralRevenue ?? 2450;

    return { total, active, totalRedemptions, totalSavings, referralConversions, referralRevenue };
  }, [allCoupons, couponStats]);

  const filteredCoupons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCoupons.filter((c) => {
      const matchSearch = !q || [c.code, c.value, c.audience, c.description || ""].join(" ").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();
      const matchType = typeFilter === "all" || c.type.toLowerCase() === typeFilter.toLowerCase();
      return matchSearch && matchStatus && matchType;
    });
  }, [allCoupons, searchQuery, statusFilter, typeFilter]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied to clipboard! 📋`);
  };

  const handleExportCSV = () => {
    if (filteredCoupons.length === 0) {
      toast.error("No coupons to export.");
      return;
    }
    const headers = ["Coupon Code", "Discount Value", "Discount Type", "Min Order (INR)", "Max Discount (INR)", "Redemptions Used", "Usage Limit", "Valid Till", "Target Audience", "Status"];
    const csvRows = [headers.join(",")];
    for (const c of filteredCoupons) {
      csvRows.push(
        [
          `"${c.code}"`,
          `"${c.value}"`,
          `"${c.type}"`,
          `"${c.minOrder}"`,
          `"${c.maxDiscount || 0}"`,
          `"${c.used}"`,
          `"${c.limit}"`,
          `"${c.validTill}"`,
          `"${c.audience}"`,
          `"${c.status}"`,
        ].join(","),
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Coupons_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Coupons list exported successfully! 🚀");
  };

  return (
    <AdminShell
      title="Coupons & Customer Referral Engine"
      subtitle="Configure promo discount codes, manage redemption caps, and set up customer referral reward incentives."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              couponsQuery.refetch();
              statsQuery.refetch();
              refSettings.refetch();
              refList.refetch();
              toast.success("Coupons & Referral data refreshed!");
            }}
            disabled={couponsQuery.isRefetching}
            className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${couponsQuery.isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="h-8 rounded-xl bg-zinc-900 px-3 text-xs font-bold text-white hover:bg-zinc-800 shadow-xs"
          >
            <Download className="size-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <CreateCouponDialog />
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP KPI SUMMARY METRICS (6 CARDS)
        ========================================================================= */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            kpi={{
              id: "tot-coupons",
              label: "Active Promo Codes",
              value: `${metrics.active} / ${metrics.total} Active`,
              hint: "Campaigns running",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-savings",
              label: "Discount Disbursed",
              value: `₹${metrics.totalSavings.toLocaleString("en-IN")}`,
              hint: "Customer savings",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-redemptions",
              label: "Total Redemptions",
              value: `${metrics.totalRedemptions} Used`,
              hint: "Times applied on orders",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "ref-conversions",
              label: "Referral Orders",
              value: `${metrics.referralConversions} Converted`,
              hint: "First orders placed",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "ref-revenue",
              label: "Referral Revenue",
              value: `₹${metrics.referralRevenue.toLocaleString("en-IN")}`,
              hint: "GMV from referrals",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "avg-saving",
              label: "Avg Order Discount",
              value: "₹45.00 / Order",
              hint: "Healthy margin control",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. MAIN TABS & TOOLBAR
        ========================================================================= */}
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="coupons" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🏷️ Promo Codes & Discount Offers ({allCoupons.length})
                </TabsTrigger>
                <TabsTrigger value="referral_program" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🎁 Referral Program Rules & Rewards
                </TabsTrigger>
                <TabsTrigger value="referral_history" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  👥 Customer Referral Log ({referralsList.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Sparkles className="size-4 text-emerald-600" />
              <span>Smart Promo Engine</span>
            </div>
          </div>

          {activeTab === "coupons" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search promo code, description, audience..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">● Active & Live</SelectItem>
                  <SelectItem value="paused">⏸️ Paused</SelectItem>
                  <SelectItem value="expired">⏳ Expired</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Discount Types</SelectItem>
                  <SelectItem value="percentage">Percentage (%) Discount</SelectItem>
                  <SelectItem value="flat">Flat Cash (₹) Discount</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </SectionCard>

        {/* =========================================================================
            3. TAB 1: PROMO CODES & DISCOUNT OFFERS
        ========================================================================= */}
        {activeTab === "coupons" && (
          <SectionCard
            title="Promo Discount Codes Directory"
            description="Manage discount coupons, minimum order cart thresholds, usage limits, and campaign expiration dates."
          >
            <DataTable
              loading={couponsQuery.isLoading}
              rows={filteredCoupons}
              emptyMessage="No coupons found matching your search."
              columns={[
                {
                  key: "code",
                  label: "Coupon Code",
                  render: (c) => (
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                        <Tag className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-zinc-900">{c.code}</span>
                          <button
                            onClick={() => handleCopyCode(c.code)}
                            className="text-zinc-400 hover:text-emerald-700 transition-colors"
                            title="Copy Code"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium truncate max-w-[180px]">
                          {c.description || c.audience}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "value",
                  label: "Discount Value",
                  render: (c) => (
                    <div className="text-xs">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                        {c.value}
                      </span>
                      {c.maxDiscount ? (
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Max cap: ₹{c.maxDiscount}</p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "minOrder",
                  label: "Min Order",
                  render: (c) => <span className="font-bold text-xs text-zinc-700">₹{c.minOrder}</span>,
                },
                {
                  key: "usage",
                  label: "Redemptions",
                  render: (c) => {
                    const pct = Math.min(100, Math.round((c.used / (c.limit || 100)) * 100));
                    return (
                      <div className="w-28 text-xs">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1">
                          <span>{c.used} used</span>
                          <span>{c.limit} max</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: "validTill",
                  label: "Valid Till",
                  render: (c) => (
                    <div className="text-xs flex items-center gap-1 text-zinc-600">
                      <Calendar className="size-3 text-zinc-400" />
                      <span>{c.validTill}</span>
                    </div>
                  ),
                },
                {
                  key: "audience",
                  label: "Audience",
                  render: (c) => (
                    <span className="rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold px-2 py-0.5">
                      {c.audience}
                    </span>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (c) => <StatusPill value={c.status} />,
                },
                {
                  key: "actions",
                  label: "",
                  className: "text-right",
                  render: (c) => (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg px-2"
                        onClick={() => setEditCoupon(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg px-2"
                        onClick={() => {
                          if (confirm(`Delete coupon ${c.code}?`)) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        )}

        {/* =========================================================================
            4. TAB 2: REFERRAL PROGRAM RULES & REWARDS
        ========================================================================= */}
        {activeTab === "referral_program" && (
          <ReferralSettingsForm initialSettings={settingsData} />
        )}

        {/* =========================================================================
            5. TAB 3: CUSTOMER REFERRAL CONVERSIONS LOG
        ========================================================================= */}
        {activeTab === "referral_history" && (
          <SectionCard
            title="Customer Referral Onboarding Log"
            description="Inspect all customers referred by friends, reward payouts credited, and initial booking values."
          >
            <DataTable
              loading={refList.isLoading}
              rows={referralsList}
              emptyMessage="No customer referrals recorded yet."
              columns={[
                {
                  key: "referrer",
                  label: "Referrer (Invited By)",
                  render: (r) => (
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">{r.referrerName}</p>
                      <p className="text-[10px] text-zinc-400">{r.referrerPhone}</p>
                    </div>
                  ),
                },
                {
                  key: "referee",
                  label: "Referee (New Customer)",
                  render: (r) => (
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">{r.refereeName}</p>
                      <p className="text-[10px] text-zinc-400">{r.refereePhone}</p>
                    </div>
                  ),
                },
                {
                  key: "reward",
                  label: "Referrer Reward",
                  render: (r) => (
                    <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      ₹{r.rewardAmount} Wallet Cash
                    </span>
                  ),
                },
                {
                  key: "discount",
                  label: "First Order Discount",
                  render: (r) => <span className="text-xs font-bold text-zinc-700">₹{r.discountApplied || 48} OFF</span>,
                },
                {
                  key: "order",
                  label: "First Order Ref",
                  render: (r) => <span className="font-mono text-[10px] font-bold text-zinc-600">{r.firstOrderId || "QP-918231"}</span>,
                },
                {
                  key: "date",
                  label: "Date",
                  render: (r) => <span className="text-xs text-zinc-400">{r.createdAt}</span>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => <StatusPill value={r.status} />,
                },
              ]}
            />
          </SectionCard>
        )}
      </div>

      {/* Edit Coupon Dialog */}
      {editCoupon && (
        <EditCouponModal
          coupon={editCoupon}
          onClose={() => setEditCoupon(null)}
        />
      )}
    </AdminShell>
  );
}

/* =========================================================================
   6. CREATE NEW COUPON DIALOG
========================================================================= */
function CreateCouponDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [discountPct, setDiscountPct] = useState("20");
  const [maxDiscount, setMaxDiscount] = useState("100");
  const [minOrder, setMinOrder] = useState("199");
  const [audience, setAudience] = useState("All Users");
  const [limit, setLimit] = useState("100");
  const [expiry, setExpiry] = useState("2026-12-31");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        code: code.toUpperCase().trim(),
        type,
        discountPct: parseInt(discountPct) || 20,
        maxDiscount: parseInt(maxDiscount) || 100,
        minOrder: parseInt(minOrder) || 199,
        discount: type === "percentage" ? `${discountPct}% OFF` : `₹${maxDiscount} OFF`,
        audience,
        limit: parseInt(limit) || 100,
        expiry,
        description,
        status: "Active",
      }),
    onSuccess: () => {
      toast.success("New promo discount code created successfully! 🎉");
      setOpen(false);
      setCode("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons", "stats"] });
    },
    onError: () => {
      toast.error("Failed to create coupon.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs">
          <Plus className="size-3.5 mr-1" />
          <span>Create Coupon</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black">Create Promo Discount Code</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Configure discount %, cart minimums, and usage limits for customers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Coupon Code</Label>
              <Input
                placeholder="e.g. FESTIVE30"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-9 text-xs uppercase font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Discount Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%) Discount</SelectItem>
                  <SelectItem value="flat">Flat Cash (₹) Discount</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Discount Value (% or ₹)</Label>
              <Input
                type="number"
                placeholder="20"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Max Discount Cap (₹)</Label>
              <Input
                type="number"
                placeholder="100"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Min Cart Order (₹)</Label>
              <Input
                type="number"
                placeholder="199"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Usage Limit (Redemptions)</Label>
              <Input
                type="number"
                placeholder="100"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Target Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Users">All Customers</SelectItem>
                  <SelectItem value="New Customers">New Customers Only</SelectItem>
                  <SelectItem value="VIP Members">VIP Members Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Expiry Date</Label>
              <Input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Description / Offer Headline</Label>
            <Input
              placeholder="e.g. 20% instant discount on dry clean"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!code || createMutation.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
          >
            {createMutation.isPending ? "Creating..." : "Launch Promo Code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCouponModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [minOrder, setMinOrder] = useState(String(coupon.minOrder));
  const [maxDiscount, setMaxDiscount] = useState(String(coupon.maxDiscount || 100));
  const [status, setStatus] = useState(coupon.status);
  const [description, setDescription] = useState(coupon.description || "");

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCoupon(coupon.id, {
        minOrder: parseInt(minOrder) || 0,
        maxDiscount: parseInt(maxDiscount) || 100,
        status,
        description,
      }),
    onSuccess: () => {
      toast.success("Coupon updated successfully! 🎉");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons", "stats"] });
    },
    onError: () => {
      toast.error("Failed to update coupon.");
    },
  });

  return (
    <Dialog open={Boolean(coupon)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black">Edit Coupon: {coupon.code}</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Update cart minimums, max discount, and operational status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Min Order Value (₹)</Label>
              <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Max Discount Cap (₹)</Label>
              <Input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Operational Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">● Active & Live</SelectItem>
                <SelectItem value="Paused">⏸️ Paused</SelectItem>
                <SelectItem value="Expired">⏳ Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-xs" />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-bold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   7. REFERRAL SETTINGS COMPONENT
========================================================================= */
function ReferralSettingsForm({ initialSettings }: { initialSettings?: ReferralProgramSettings }) {
  const queryClient = useQueryClient();
  const [referrerReward, setReferrerReward] = useState(String(initialSettings?.referrerRewardAmount || 100));
  const [refereeDiscount, setRefereeDiscount] = useState(String(initialSettings?.refereeDiscountPercent || 20));
  const [minOrder, setMinOrder] = useState(String(initialSettings?.refereeMinOrderValue || 199));
  const [maxDiscount, setMaxDiscount] = useState(String(initialSettings?.refereeMaxDiscount || 100));
  const [headline, setHeadline] = useState(initialSettings?.headline || "Invite Friends, Earn ₹100");

  const updateMutation = useMutation({
    mutationFn: () =>
      updateReferralSettings({
        referrerRewardAmount: parseInt(referrerReward) || 100,
        refereeDiscountPercent: parseInt(refereeDiscount) || 20,
        refereeMinOrderValue: parseInt(minOrder) || 199,
        refereeMaxDiscount: parseInt(maxDiscount) || 100,
        headline,
      }),
    onSuccess: () => {
      toast.success("Customer referral program rules updated! 🎉");
      queryClient.invalidateQueries({ queryKey: ["admin", "referral-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "referral-stats"] });
    },
    onError: () => {
      toast.error("Failed to update referral rules.");
    },
  });

  return (
    <SectionCard
      title="Customer Referral & Growth Program Configuration"
      description="Define the wallet reward given to the inviter and the discount percentage granted to the new customer on their first booking."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Referrer Incentive (Inviter)</span>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-emerald-950">Wallet Cash Reward (₹)</Label>
              <Input
                type="number"
                value={referrerReward}
                onChange={(e) => setReferrerReward(e.target.value)}
                className="h-10 text-sm font-black bg-white"
              />
              <p className="text-[10px] text-emerald-700">Credited directly to customer's wallet upon friend's first delivered order.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800">Referee Discount (Invited Friend)</span>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-sky-950">First Order Discount (%)</Label>
              <Input
                type="number"
                value={refereeDiscount}
                onChange={(e) => setRefereeDiscount(e.target.value)}
                className="h-10 text-sm font-black bg-white"
              />
              <p className="text-[10px] text-sky-700">Instant discount applied on their first booking checkout.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs font-bold">Min Order Cart Value for Referral (₹)</Label>
            <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="h-9 text-xs" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Max Discount Cap for Referee (₹)</Label>
            <Input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} className="h-9 text-xs" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-bold">Customer App Banner Headline</Label>
          <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-9 text-xs" />
        </div>

        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white h-10 px-4"
        >
          <Save className="size-3.5 mr-1.5" />
          {updateMutation.isPending ? "Saving Rules..." : "Save Referral Program Rules"}
        </Button>
      </div>
    </SectionCard>
  );
}
