import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Crown,
  Edit2,
  Gift,
  Headphones,
  Package,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  Zap,
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
  createMembershipPlan,
  deleteMembershipPlan,
  fetchAdminMembershipPlans,
  fetchMembershipStats,
  fetchMembershipSubscribers,
  fetchMembershipTransactions,
  grantCustomerMembership,
  revokeCustomerMembership,
  updateMembershipPlan,
  type AdminGrantPayload,
  type AdminPlanPayload,
  type MembershipBenefit,
  type MembershipPlan,
  type MembershipSubscriberItem,
} from "../api/memberships";

export const Route = createFileRoute("/memberships")({
  component: MembershipsScreen,
});

const COLOR_OPTIONS = [
  { value: "emerald", label: "Emerald Green", bg: "bg-emerald-500" },
  { value: "amber", label: "Amber Gold", bg: "bg-amber-500" },
  { value: "indigo", label: "Indigo Blue", bg: "bg-indigo-500" },
  { value: "purple", label: "Royal Purple", bg: "bg-purple-500" },
  { value: "rose", label: "Rose Crimson", bg: "bg-rose-500" },
  { value: "sky", label: "Sky Cyan", bg: "bg-sky-500" },
];

const BENEFIT_TEMPLATES: { id: string; title: string; description: string; icon: string }[] = [
  { id: "free-delivery", title: "Free Delivery", description: "Zero delivery fee on qualifying orders", icon: "truck" },
  { id: "free-pickup", title: "Free Doorstep Pickup", description: "Free doorstep pickup on all orders", icon: "package" },
  { id: "extra-discount", title: "Extra Member Discount", description: "Flat % off on all laundry services", icon: "percent" },
  { id: "priority-processing", title: "Priority Processing", description: "Express 4-8 hr order turnaround", icon: "zap" },
  { id: "dedicated-support", title: "24x7 Dedicated VIP Support", description: "Direct VIP hotline & support line", icon: "headphones" },
  { id: "exclusive-rewards", title: "Exclusive Member Coupons", description: "Access to private reward drops & offers", icon: "gift" },
];

function MembershipsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"plans" | "subscribers" | "transactions">("plans");

  // Plan Modal state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<AdminPlanPayload>({
    name: "",
    tagline: "",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    validityDays: 30,
    yearlyValidityDays: 365,
    popular: false,
    status: "Active",
    badge: "",
    color: "emerald",
    order: 1,
    discountPercent: 10,
    freeDeliveryMinOrder: 0,
    freePickup: true,
    priorityProcessing: false,
    supportTier: "Standard",
    benefits: [],
  });

  // Grant Modal state
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantForm, setGrantForm] = useState<{ userId: string; planId: string; cycle: "monthly" | "yearly"; days: number; reason: string }>({
    userId: "",
    planId: "gold",
    cycle: "monthly",
    days: 30,
    reason: "Promotional Grant",
  });

  // Subscribers filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "memberships", "stats"],
    queryFn: fetchMembershipStats,
    refetchInterval: 30000,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["admin", "memberships", "plans"],
    queryFn: () => fetchAdminMembershipPlans(true),
  });

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery({
    queryKey: ["admin", "memberships", "subscribers", searchQuery, statusFilter, tierFilter],
    queryFn: () =>
      fetchMembershipSubscribers({
        q: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
        planId: tierFilter !== "all" ? tierFilter : undefined,
      }),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin", "memberships", "transactions"],
    queryFn: () => fetchMembershipTransactions({ limit: 100 }),
  });

  // Mutations
  const savePlanMutation = useMutation({
    mutationFn: async (payload: AdminPlanPayload) => {
      if (editingPlanId) {
        return updateMembershipPlan(editingPlanId, payload);
      }
      return createMembershipPlan(payload);
    },
    onSuccess: (saved) => {
      toast.success(editingPlanId ? `Plan '${saved.name}' updated!` : `Plan '${saved.name}' created!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] });
      setPlanModalOpen(false);
      setEditingPlanId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save membership plan");
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => deleteMembershipPlan(planId),
    onSuccess: () => {
      toast.success("Membership plan archived/deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete plan");
    },
  });

  const grantMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminGrantPayload }) =>
      grantCustomerMembership(userId, payload),
    onSuccess: (sub) => {
      toast.success(`Granted '${sub.planName}' to ${sub.userName}!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] });
      setGrantModalOpen(false);
      setGrantForm({ userId: "", planId: "gold", cycle: "monthly", days: 30, reason: "" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to grant membership");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      revokeCustomerMembership(userId, reason),
    onSuccess: () => {
      toast.success("Membership revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke membership");
    },
  });

  // Open Edit Modal
  const handleOpenEdit = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      id: plan.id,
      name: plan.name,
      tagline: plan.tagline,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      validityDays: plan.validityDays,
      yearlyValidityDays: plan.yearlyValidityDays,
      popular: plan.popular,
      status: plan.status === "Archived" ? "Inactive" : plan.status,
      badge: plan.badge,
      color: plan.color || "emerald",
      order: plan.order,
      discountPercent: plan.discountPercent,
      freeDeliveryMinOrder: plan.freeDeliveryMinOrder,
      freePickup: plan.freePickup,
      priorityProcessing: plan.priorityProcessing,
      supportTier: plan.supportTier,
      benefits: plan.benefits || [],
    });
    setPlanModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPlanId(null);
    setPlanForm({
      name: "",
      tagline: "",
      monthlyPrice: 199,
      yearlyPrice: 1990,
      validityDays: 30,
      yearlyValidityDays: 365,
      popular: false,
      status: "Active",
      badge: "POPULAR",
      color: "emerald",
      order: plans.length + 1,
      discountPercent: 10,
      freeDeliveryMinOrder: 0,
      freePickup: true,
      priorityProcessing: false,
      supportTier: "Priority Chat",
      benefits: [
        { id: "free-delivery", title: "Free Delivery", description: "Zero delivery fees on all orders", icon: "truck" },
        { id: "free-pickup", title: "Free Doorstep Pickup", description: "No pickup charge", icon: "package" },
      ],
    });
    setPlanModalOpen(true);
  };

  const toggleBenefit = (template: { id: string; title: string; description: string; icon: string }) => {
    const exists = planForm.benefits.some((b) => b.id === template.id || b.title === template.title);
    if (exists) {
      setPlanForm((prev) => ({
        ...prev,
        benefits: prev.benefits.filter((b) => b.id !== template.id && b.title !== template.title),
      }));
    } else {
      setPlanForm((prev) => ({
        ...prev,
        benefits: [
          ...prev.benefits,
          { id: template.id, title: template.title, description: template.description, icon: template.icon },
        ],
      }));
    }
  };

  const subscribers = subscribersData?.items || [];
  const transactions = transactionsData?.items || [];

  return (
    <AdminShell
      title="Memberships & Subscription Engine"
      description="Configure membership tiers, pricing, delivery/pickup perks, and manage active customer subscriptions."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGrantModalOpen(true)}
            className="border-zinc-300 font-bold hover:bg-zinc-100"
          >
            <UserPlus className="mr-1.5 size-4 text-emerald-600" />
            Grant Membership
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-emerald-600 font-bold hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="mr-1.5 size-4" />
            Create New Plan
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              label: "Active Subscribers",
              value: statsLoading ? "..." : String(stats?.activeMembers || 0),
              delta: `${stats?.totalSubscribers || 0} Total ever`,
              hint: `${stats?.expiringSoonCount || 0} expiring this week`,
            }}
          />
          <KpiCard
            kpi={{
              label: "Monthly Recurring (MRR)",
              value: statsLoading ? "..." : `₹${(stats?.monthlyRecurringRevenue || 0).toLocaleString("en-IN")}`,
              delta: "+18.4% MoM",
              positive: true,
              hint: "Recurring base",
            }}
          />
          <KpiCard
            kpi={{
              label: "Annual Run Rate (ARR)",
              value: statsLoading ? "..." : `₹${(stats?.annualRunRate || 0).toLocaleString("en-IN")}`,
              delta: "Projected",
              hint: "12-month value",
            }}
          />
          <KpiCard
            kpi={{
              label: "Top Plan Tier",
              value: statsLoading ? "..." : stats?.topPlanName || "Gold",
              hint: `${Object.values(stats?.tierBreakdown || {}).reduce((a, b) => a + b, 0)} paid tiers`,
            }}
          />
        </div>

        {/* Tabs Control */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <TabsList className="bg-zinc-100/80 p-1">
              <TabsTrigger value="plans" className="gap-2 font-bold">
                <Crown className="size-4 text-amber-500" />
                Plans Management ({plans.length})
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="gap-2 font-bold">
                <Users className="size-4 text-emerald-600" />
                Subscribers Directory ({subscribersData?.total || subscribers.length})
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2 font-bold">
                <Coins className="size-4 text-indigo-600" />
                Revenue Ledger ({transactionsData?.total || transactions.length})
              </TabsTrigger>
            </TabsList>

            {activeTab === "plans" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] })}
                className="border-zinc-200 text-xs font-bold"
              >
                <RefreshCw className="mr-1 size-3.5" />
                Refresh
              </Button>
            )}
          </div>

          {/* ---------------------------------------------------- TAB 1: PLANS */}
          <TabsContent value="plans" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => {
                const isActive = plan.status === "Active";
                const isFree = plan.id === "free" || (plan.monthlyPrice === 0 && plan.yearlyPrice === 0);

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
                      plan.popular ? "border-amber-400 ring-2 ring-amber-400/20" : "border-zinc-200"
                    }`}
                  >
                    {/* Badges row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide ${
                            isActive
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          {plan.status}
                        </span>

                        {plan.badge && (
                          <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 border border-amber-300">
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(plan)}
                          className="size-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                          title="Edit plan"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        {!isFree && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Archive membership plan '${plan.name}'?`)) {
                                deletePlanMutation.mutate(plan.id);
                              }
                            }}
                            className="size-8 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete or Archive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Plan Header */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <Crown
                          className={`size-6 ${
                            plan.color === "amber"
                              ? "text-amber-500"
                              : plan.color === "indigo"
                              ? "text-indigo-600"
                              : plan.color === "purple"
                              ? "text-purple-600"
                              : "text-emerald-600"
                          }`}
                        />
                        <h3 className="text-xl font-black text-zinc-900">{plan.name}</h3>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 min-h-[32px]">{plan.tagline || "Standard plan privileges"}</p>
                    </div>

                    {/* Pricing Block */}
                    <div className="mt-4 rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-3xl font-black text-zinc-900">
                            {isFree ? "Free" : `₹${plan.monthlyPrice}`}
                          </span>
                          {!isFree && <span className="text-xs font-bold text-zinc-500"> / month</span>}
                        </div>
                        {!isFree && plan.yearlyPrice > 0 && (
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-zinc-700">₹{plan.yearlyPrice}</span>
                            <span className="text-[10px] text-zinc-500"> / year</span>
                          </div>
                        )}
                      </div>

                      {!isFree && plan.yearlySavings > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-100/70 px-2 py-1 text-[11px] font-black text-emerald-900 border border-emerald-200">
                          <Sparkles className="size-3 text-emerald-700" />
                          Save ₹{plan.yearlySavings} on Annual Billing
                        </div>
                      )}
                    </div>

                    {/* Feature Highlights Grid */}
                    <div className="mt-5 space-y-2.5 border-t border-zinc-100 pt-4 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Core Engine Perks</p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-700 font-bold">
                          <Percent className="size-3.5 text-emerald-600" />
                          <span>{plan.discountPercent}% Extra Off</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-700 font-bold">
                          <Truck className="size-3.5 text-emerald-600" />
                          <span>{plan.freeDeliveryMinOrder === 0 ? "Free Delivery" : `Free > ₹${plan.freeDeliveryMinOrder}`}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-700 font-bold">
                          <Package className="size-3.5 text-emerald-600" />
                          <span>{plan.freePickup ? "Free Pickup" : "Standard Pickup"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-700 font-bold">
                          <Zap className="size-3.5 text-amber-500" />
                          <span>{plan.priorityProcessing ? "Priority Slot" : "Standard Slot"}</span>
                        </div>
                      </div>

                      {/* Benefits Checklist */}
                      {plan.benefits && plan.benefits.length > 0 && (
                        <div className="mt-3 space-y-1.5 pt-2 border-t border-zinc-100">
                          {plan.benefits.slice(0, 4).map((b) => (
                            <div key={b.id} className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                              <Check className="size-3.5 text-emerald-600 shrink-0 font-bold" />
                              <span className="truncate">{b.title}</span>
                            </div>
                          ))}
                          {plan.benefits.length > 4 && (
                            <p className="text-[10px] font-bold text-zinc-400 pl-5">
                              +{plan.benefits.length - 4} more benefits included
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Order & ID */}
                    <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-400 font-mono">
                      <span>ID: {plan.id}</span>
                      <span>Order: #{plan.order}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ------------------------------------------------ TAB 2: SUBSCRIBERS */}
          <TabsContent value="subscribers" className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-zinc-200">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                <Input
                  placeholder="Search by customer name, phone, email, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] text-xs font-bold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[140px] text-xs font-bold">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subscribers Table */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <DataTable
                columns={[
                  {
                    header: "Customer",
                    cell: (row: MembershipSubscriberItem) => (
                      <div>
                        <p className="font-extrabold text-zinc-900">{row.userName}</p>
                        <p className="text-xs text-zinc-500 font-mono">{row.userPhone || row.userEmail || row.userId}</p>
                      </div>
                    ),
                  },
                  {
                    header: "Current Tier",
                    cell: (row: MembershipSubscriberItem) => (
                      <div className="flex items-center gap-1.5">
                        <Crown className="size-4 text-amber-500" />
                        <span className="font-black text-xs text-zinc-800">{row.planName}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-400">({row.billingCycle})</span>
                      </div>
                    ),
                  },
                  {
                    header: "Validity & Expiry",
                    cell: (row: MembershipSubscriberItem) => (
                      <div>
                        <p className="text-xs font-bold text-zinc-800">
                          {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Lifetime"}
                        </p>
                        {row.status === "active" && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {row.remainingDays} days remaining
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    header: "Status",
                    cell: (row: MembershipSubscriberItem) => (
                      <StatusPill
                        status={
                          row.status === "active"
                            ? "Active"
                            : row.status === "expired"
                            ? "Expired"
                            : row.status === "cancelled"
                            ? "Cancelled"
                            : "Draft"
                        }
                      />
                    ),
                  },
                  {
                    header: "Actions",
                    cell: (row: MembershipSubscriberItem) => (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGrantForm({
                              userId: row.userId,
                              planId: row.planId !== "free" ? row.planId : "gold",
                              cycle: (row.billingCycle as any) || "monthly",
                              days: 30,
                              reason: "Admin Plan Extension",
                            });
                            setGrantModalOpen(true);
                          }}
                          className="h-7 text-xs font-bold border-zinc-200 hover:bg-zinc-50"
                        >
                          Extend / Change
                        </Button>
                        {row.status === "active" && row.planId !== "free" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const reason = prompt("Enter reason for revocation:");
                              if (reason !== null) {
                                revokeMutation.mutate({ userId: row.userId, reason });
                              }
                            }}
                            className="h-7 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={subscribers}
                emptyTitle="No membership subscribers found"
                emptyDescription="Subscribers will appear here once customers purchase plans or when granted by Admin."
              />
            </div>
          </TabsContent>

          {/* ------------------------------------------------ TAB 3: TRANSACTIONS */}
          <TabsContent value="transactions" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <DataTable
                columns={[
                  {
                    header: "Transaction ID",
                    cell: (row: any) => (
                      <div>
                        <span className="font-mono text-xs font-bold text-zinc-900">{row.id}</span>
                        {row.paymentReference && (
                          <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{row.paymentReference}</p>
                        )}
                      </div>
                    ),
                  },
                  {
                    header: "Plan & Event",
                    cell: (row: any) => (
                      <div>
                        <p className="font-extrabold text-xs text-zinc-900">{row.planName}</p>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {row.type}
                        </span>
                      </div>
                    ),
                  },
                  {
                    header: "Billing Cycle",
                    cell: (row: any) => (
                      <span className="text-xs font-bold capitalize text-zinc-700">{row.billingCycle}</span>
                    ),
                  },
                  {
                    header: "Amount",
                    cell: (row: any) => (
                      <span className="text-sm font-black text-zinc-900">
                        {row.amount === 0 ? "Free / Grant" : `₹${row.amount}`}
                      </span>
                    ),
                  },
                  {
                    header: "Payment Status",
                    cell: (row: any) => (
                      <StatusPill
                        status={
                          row.paymentStatus === "paid"
                            ? "Active"
                            : row.paymentStatus === "free"
                            ? "Active"
                            : row.paymentStatus === "refunded"
                            ? "Cancelled"
                            : "Draft"
                        }
                      />
                    ),
                  },
                  {
                    header: "Date & Time",
                    cell: (row: any) => (
                      <span className="text-xs font-medium text-zinc-500">
                        {row.subscribedAt ? new Date(row.subscribedAt).toLocaleString("en-IN") : "—"}
                      </span>
                    ),
                  },
                ]}
                data={transactions}
                emptyTitle="No membership transactions found"
                emptyDescription="All subscription events, renewals, and payments will be logged here in real-time."
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------------------------------------------------- CREATE / EDIT MODAL */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-zinc-900">
              <Crown className="size-5 text-amber-500" />
              {editingPlanId ? "Edit Membership Plan" : "Create New Membership Plan"}
            </DialogTitle>
            <DialogDescription>
              Configure plan pricing, validity, discounts, and customer perks. Active plans will appear in customer app instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Name and Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Plan Name *</Label>
                <Input
                  placeholder="e.g. VIP Platinum, Gold Club"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Badge Text (Optional)</Label>
                <Input
                  placeholder="e.g. BEST VALUE, MOST POPULAR"
                  value={planForm.badge}
                  onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                  className="text-xs uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tagline</Label>
              <Input
                placeholder="e.g. Unlimited express laundry with free doorstep pickup"
                value={planForm.tagline}
                onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                className="text-xs"
              />
            </div>

            {/* Pricing Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Monthly Price (₹) *</Label>
                <Input
                  type="number"
                  value={planForm.monthlyPrice}
                  onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: Number(e.target.value) })}
                  className="text-xs font-black"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Yearly Price (₹) *</Label>
                <Input
                  type="number"
                  value={planForm.yearlyPrice}
                  onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: Number(e.target.value) })}
                  className="text-xs font-black"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Monthly Days</Label>
                <Input
                  type="number"
                  value={planForm.validityDays}
                  onChange={(e) => setPlanForm({ ...planForm, validityDays: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Yearly Days</Label>
                <Input
                  type="number"
                  value={planForm.yearlyValidityDays}
                  onChange={(e) => setPlanForm({ ...planForm, yearlyValidityDays: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Core Engine Perks */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-wider text-zinc-600">
                Cart & Checkout Engine Perks
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 p-3 rounded-xl border border-zinc-200 bg-white">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <Percent className="size-3.5 text-emerald-600" />
                    Extra Member Discount (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 10"
                    value={planForm.discountPercent}
                    onChange={(e) => setPlanForm({ ...planForm, discountPercent: Number(e.target.value) })}
                    className="text-xs font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Waives % on items total at checkout</p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl border border-zinc-200 bg-white">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <Truck className="size-3.5 text-emerald-600" />
                    Free Delivery Min Order (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 = Unlimited free delivery"
                    value={planForm.freeDeliveryMinOrder}
                    onChange={(e) => setPlanForm({ ...planForm, freeDeliveryMinOrder: Number(e.target.value) })}
                    className="text-xs font-bold"
                  />
                  <p className="text-[10px] text-zinc-400">Set 0 for free delivery on every order</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={planForm.freePickup}
                    onChange={(e) => setPlanForm({ ...planForm, freePickup: e.target.checked })}
                    className="size-4 accent-emerald-600 rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-800">Free Doorstep Pickup</p>
                    <p className="text-[10px] text-zinc-400">Waive pickup fee</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={planForm.priorityProcessing}
                    onChange={(e) => setPlanForm({ ...planForm, priorityProcessing: e.target.checked })}
                    className="size-4 accent-amber-500 rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-800">Priority Processing</p>
                    <p className="text-[10px] text-zinc-400">Express slot badge</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={planForm.popular}
                    onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                    className="size-4 accent-amber-500 rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-800">Popular Highlight</p>
                    <p className="text-[10px] text-zinc-400">Highlight in app</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Benefits Checklist */}
            <div className="space-y-2 border-t border-zinc-100 pt-4">
              <Label className="text-xs font-black uppercase tracking-wider text-zinc-600">
                Customer Benefits Checklist
              </Label>
              <p className="text-xs text-zinc-400">Select perks shown in the customer comparison table:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {BENEFIT_TEMPLATES.map((tpl) => {
                  const selected = planForm.benefits.some((b) => b.id === tpl.id || b.title === tpl.title);
                  return (
                    <button
                      type="button"
                      key={tpl.id}
                      onClick={() => toggleBenefit(tpl)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        selected
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                          : "bg-zinc-50/50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      <div
                        className={`size-4 rounded flex items-center justify-center mt-0.5 ${
                          selected ? "bg-emerald-600 text-white" : "border border-zinc-300 bg-white"
                        }`}
                      >
                        {selected && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{tpl.title}</p>
                        <p className="text-[10px] text-zinc-400">{tpl.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Plan Status</Label>
                <Select
                  value={planForm.status}
                  onValueChange={(val: any) => setPlanForm({ ...planForm, status: val })}
                >
                  <SelectTrigger className="text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active (Visible in App)</SelectItem>
                    <SelectItem value="Inactive">Inactive (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Display Color Theme</Label>
                <Select
                  value={planForm.color}
                  onValueChange={(val: any) => setPlanForm({ ...planForm, color: val })}
                >
                  <SelectTrigger className="text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <span className={`size-3 rounded-full ${c.bg}`} />
                          <span>{c.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-100 pt-3">
            <Button variant="outline" size="sm" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!planForm.name.trim()) {
                  toast.error("Please enter a plan name");
                  return;
                }
                savePlanMutation.mutate(planForm);
              }}
              disabled={savePlanMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {savePlanMutation.isPending ? "Saving..." : editingPlanId ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- GRANT MEMBERSHIP MODAL */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-zinc-900">
              <UserPlus className="size-5 text-emerald-600" />
              Grant Membership to Customer
            </DialogTitle>
            <DialogDescription>
              Assign a membership plan directly to a customer account with custom validity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Customer User ID *</Label>
              <Input
                placeholder="e.g. usr-12345 or search ID"
                value={grantForm.userId}
                onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Membership Plan Tier</Label>
              <Select
                value={grantForm.planId}
                onValueChange={(val) => setGrantForm({ ...grantForm, planId: val })}
              >
                <SelectTrigger className="text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans
                    .filter((p) => p.id !== "free")
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (₹{p.monthlyPrice}/mo)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Billing Cycle</Label>
                <Select
                  value={grantForm.cycle}
                  onValueChange={(val: any) => setGrantForm({ ...grantForm, cycle: val })}
                >
                  <SelectTrigger className="text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Validity (Days)</Label>
                <Input
                  type="number"
                  value={grantForm.days}
                  onChange={(e) => setGrantForm({ ...grantForm, days: Number(e.target.value) })}
                  className="text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Reason / Audit Note</Label>
              <Input
                placeholder="e.g. VIP Customer Promo, CS Compensation"
                value={grantForm.reason}
                onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-100 pt-3">
            <Button variant="outline" size="sm" onClick={() => setGrantModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!grantForm.userId.trim()) {
                  toast.error("Please enter a customer user ID");
                  return;
                }
                grantMutation.mutate({
                  userId: grantForm.userId.trim(),
                  payload: {
                    planId: grantForm.planId,
                    billingCycle: grantForm.cycle,
                    validityDays: grantForm.days,
                    reason: grantForm.reason,
                  },
                });
              }}
              disabled={grantMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {grantMutation.isPending ? "Granting..." : "Grant Membership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
