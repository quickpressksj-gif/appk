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
import { createCoupon, fetchCoupons, fetchOffers, type AdminCoupon } from "../api/coupons";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/coupons")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Coupons & Promotional Offers", "Create, track and manage QuickPress discounts and referrals."),
  component: CouponsPage,
});

export function CouponsPage() {
  const queryClient = useQueryClient();
  const coupons = useQuery({ queryKey: ["admin", "coupons"], queryFn: fetchCoupons });
  const offers = useQuery({ queryKey: ["admin", "offers"], queryFn: fetchOffers });

  const [activeTab, setActiveTab] = useState("coupons");
  const [searchQuery, setSearchQuery] = useState("");

  const allCoupons = coupons.data ?? [];
  const allOffers = offers.data ?? [];

  const metrics = useMemo(() => {
    const total = allCoupons.length;
    const active = allCoupons.filter((c) => c.status === "Active").length;
    const totalRedemptions = allCoupons.reduce((sum, c) => sum + (c.used || 0), 0);
    const activePrograms = allOffers.length;
    return { total, active, totalRedemptions, activePrograms };
  }, [allCoupons, allOffers]);

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
        ].join(","),
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
      title="Coupons & Promotional Offers"
      subtitle="Manage customer discount codes, welcome incentives, and referral programs."
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
              label: "Referral Programs",
              value: metrics.activePrograms.toLocaleString("en-IN"),
              hint: "Automated reward pipelines",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. MAIN TABS
        ========================================================================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-zinc-100 p-1 rounded-xl">
            <TabsTrigger value="coupons" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Coupon Codes ({allCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Referrals & Loyalty ({allOffers.length})
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
                  { key: "minOrder", label: "Min Order Req", render: (r) => <span className="font-mono text-xs text-zinc-700 font-semibold">{r.minOrder}</span> },
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

          {/* TAB 2: OFFERS & REFERRALS */}
          <TabsContent value="offers" className="space-y-4">
            <SectionCard
              title="Referral & Loyalty Programs"
              description="Automated customer acquisition rewards and retention incentives"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allOffers.map((off) => (
                  <div
                    key={off.name}
                    className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                          <Gift className="size-5" />
                        </div>
                        <StatusPill value={off.status} />
                      </div>
                      <h4 className="mt-3 text-sm font-black text-zinc-900">{off.name}</h4>
                      <p className="mt-1 text-xs text-emerald-700 font-bold">{off.reward}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400 font-medium">
                      <span>Type: {off.kind}</span>
                      <span>Window: {off.window}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
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
