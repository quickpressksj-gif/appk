import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  Clock,
  CloudOff,
  CreditCard,
  Crown,
  Gift,
  Headphones,
  Loader2,
  Package,
  Percent,
  RefreshCw,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/home/BottomNav";
import { EmptyState } from "@/components/common/EmptyState";
import {
  MembershipHistorySkeleton,
  MembershipSkeleton,
} from "@/components/membership/MembershipSkeletons";
import { NotificationBellAction, ScreenTopBar } from "@/components/rewards/ScreenTopBar";
import { Toaster } from "@/shared/ui/sonner";
import { isApiError } from "@/api/core/errors";
import { isOnline, onNetworkChange } from "@/api/customer/api/network";
import {
  cancelMembership,
  fetchMembership,
  fetchMembershipHistory,
  fetchMembershipPlans,
  formatMembershipPrice,
  subscribeMembership,
  type BillingCycle,
  type Membership,
  type MembershipHistory,
  type MembershipPlan,
  type MembershipPlanId,
  type MembershipPlans,
} from "@/api/customer/membership-api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { payWithRazorpay } from "@/api/payments/razorpay-api";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "QuickPress Membership — Plans, Benefits & Renewal" },
      {
        name: "description",
        content:
          "Compare QuickPress Free, Silver, Gold and Premium memberships, track your expiry and remaining days, renew or cancel, and view your subscription history.",
      },
      { property: "og:title", content: "QuickPress Membership — Plans, Benefits & Renewal" },
      {
        property: "og:description",
        content:
          "Subscribe to a QuickPress membership for free pickup, free delivery, extra discounts and priority laundry processing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MembershipScreen,
});

type TabId = "overview" | "plans" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "My plan" },
  { id: "plans", label: "Plans" },
  { id: "history", label: "History" },
];

const BENEFIT_ICONS = {
  truck: Truck,
  package: Package,
  percent: Percent,
  zap: Zap,
  headphones: Headphones,
  gift: Gift,
  clock: Clock,
  sparkles: Sparkles,
} as const;

function benefitIcon(icon: string) {
  return BENEFIT_ICONS[icon as keyof typeof BENEFIT_ICONS] ?? Sparkles;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Crown;
  label: string;
  value: string;
}) {
  return (
    <div className="card-soft flex flex-col items-start gap-2 border border-border px-4 py-4">
      <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/12 text-brand-dark">
        <Icon className="size-4" />
      </span>
      <p className="text-lg font-black leading-none tracking-tight text-foreground">{value}</p>
      <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function BenefitRow({ title, description, icon }: { title: string; description: string; icon: string }) {
  const Icon = benefitIcon(icon);
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-brand-dark">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </li>
  );
}

function PlanCard({
  plan,
  cycle,
  current,
  busy,
  onSubscribe,
}: {
  plan: MembershipPlan;
  cycle: BillingCycle;
  current: boolean;
  busy: boolean;
  onSubscribe: (planId: MembershipPlanId) => void;
}) {
  const price = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const suffix = price > 0 ? (cycle === "yearly" ? "/year" : "/month") : "";
  return (
    <article className="card-soft border border-border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black tracking-tight text-foreground">
            {plan.name}
            {plan.popular ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-brand-dark">
                Popular
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">{plan.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-black leading-none tracking-tight text-foreground">
            {formatMembershipPrice(price)}
          </p>
          <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground">
            {suffix || "forever"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[0.62rem] font-semibold text-muted-foreground">
          {cycle === "yearly" ? `Valid ${plan.yearlyValidityDays} days` : plan.validityLabel}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[0.62rem] font-semibold text-muted-foreground">
          {plan.savingsLabel}
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {plan.benefits.map((benefit) => (
          <BenefitRow
            key={benefit.id}
            title={benefit.title}
            description={benefit.description}
            icon={benefit.icon}
          />
        ))}
      </ul>

      <button
        type="button"
        disabled={busy || current}
        onClick={() => onSubscribe(plan.id)}
        className="ripple mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.97] disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {current ? "Current plan" : price > 0 ? `Subscribe ${cycle}` : "Switch to Free"}
      </button>
    </article>
  );
}

function MembershipScreen() {
  useAuthGuard();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plans, setPlans] = useState<MembershipPlans | null>(null);
  const [history, setHistory] = useState<MembershipHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [pendingPlan, setPendingPlan] = useState<MembershipPlanId | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async (options: { refresh?: boolean } = {}) => {
    if (options.refresh) setRefreshing(true);
    setError(null);
    try {
      const [current, catalogue] = await Promise.all([
        fetchMembership(options.refresh ? { forceRefresh: true } : {}),
        fetchMembershipPlans(options.refresh ? { forceRefresh: true } : {}),
      ]);
      setMembership(current);
      setPlans(catalogue);
    } catch (caught) {
      setError(isApiError(caught) ? caught.userMessage : "We couldn't load your membership.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async (options: { refresh?: boolean } = {}) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      setHistory(await fetchMembershipHistory(options.refresh ? { forceRefresh: true } : {}));
    } catch (caught) {
      setHistoryError(
        isApiError(caught) ? caught.userMessage : "We couldn't load your membership history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === "history" && !history && !historyLoading) void loadHistory();
  }, [tab, history, historyLoading, loadHistory]);

  /* Offline banner + automatic sync when the connection returns. */
  useEffect(() => {
    setOffline(!isOnline());
    return onNetworkChange((online) => {
      setOffline(!online);
      if (online) {
        void load({ refresh: true });
        if (history) void loadHistory({ refresh: true });
      }
    });
  }, [load, loadHistory, history]);

  const handleSubscribe = async (planId: MembershipPlanId) => {
    setPendingPlan(planId);
    try {
      const selectedPlan = plans?.plans.find((p) => p.id === planId);
      const planPrice = selectedPlan ? (cycle === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice) : 0;

      if (planId !== "free" && planPrice > 0) {
        const payResult = await payWithRazorpay({
          amount: planPrice,
          purpose: `Membership: ${planId} (${cycle})`,
          description: `Subscribe to ${selectedPlan?.name || planId} Plan (${cycle})`,
        });

        if (payResult.status === "paid") {
          toast.success(`Welcome to ${selectedPlan?.name || "VIP"} Membership!`);
          setHistory(null);
          await load({ refresh: true });
          setTab("overview");
        } else if (payResult.status === "cancelled") {
          toast.info("Payment cancelled.");
        } else {
          toast.error(payResult.message || "Payment failed. Please try again.");
        }
      } else {
        const result = await subscribeMembership(planId, cycle);
        toast.success(result.message);
        setHistory(null);
        await load({ refresh: true });
        setTab("overview");
      }
    } catch (caught) {
      toast.error(
        isApiError(caught) ? caught.userMessage : "We couldn't update your membership.",
      );
    } finally {
      setPendingPlan(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const result = await cancelMembership();
      toast.success(result.message);
      setHistory(null);
      await load({ refresh: true });
    } catch (caught) {
      toast.error(
        isApiError(caught) ? caught.userMessage : "We couldn't cancel your membership.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const activePlan = membership?.plan ?? null;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white dark:bg-zinc-950">
      <div className="relative mx-auto w-full max-w-md">
        <ScreenTopBar title="Membership" action={<NotificationBellAction />} />

        {offline ? (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <CloudOff className="size-4" />
            You're offline — showing your saved membership.
          </div>
        ) : null}

        {!membership && !error ? <MembershipSkeleton /> : null}

        {!membership && error ? (
          <div className="px-5 pb-32 pt-6">
            <EmptyState
              icon={CloudOff}
              title="Membership didn't load"
              description={error}
              actionLabel="Try again"
              onAction={() => void load({ refresh: true })}
            />
          </div>
        ) : null}

        {membership ? (
          <div className="px-5 pb-32 pt-4">
            {/* Current plan — GET /api/membership */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
              <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
                    Current plan
                  </p>
                  <p className="mt-1 flex items-center gap-2 truncate text-2xl font-black tracking-tight text-background">
                    <Crown className="size-5" />
                    {membership.planName}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-background/75">
                    {membership.active
                      ? `Active until ${membership.expiresLabel} · ${membership.remainingDays} day${
                          membership.remainingDays === 1 ? "" : "s"
                        } remaining`
                      : membership.status === "expired"
                        ? "Your membership expired — renew to restore your benefits."
                        : membership.status === "cancelled"
                          ? "Membership cancelled — you're on the Free plan."
                          : "You're on the Free plan. Upgrade to unlock member benefits."}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Refresh membership"
                  onClick={() => void load({ refresh: true })}
                  className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background/15 text-background transition-all duration-300 active:scale-[0.94]"
                >
                  {refreshing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </button>
              </div>

              <div className="relative mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-background/15 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-widest text-background/85">
                  {membership.billingCycle ?? "no billing"}
                </span>
                <span className="rounded-full bg-background/15 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-widest text-background/85">
                  {membership.status}
                </span>
                {membership.amountPaid > 0 ? (
                  <span className="rounded-full bg-background/15 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-widest text-background/85">
                    {formatMembershipPrice(membership.amountPaid)} paid
                  </span>
                ) : null}
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3">
              <StatCard
                icon={Clock}
                label="Days remaining"
                value={String(membership.remainingDays)}
              />
              <StatCard icon={BadgeCheck} label="Expires on" value={membership.expiresLabel} />
            </section>

            {/* Tabs */}
            <div className="mt-6 flex gap-2 rounded-2xl bg-muted p-1">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`h-9 flex-1 rounded-xl text-xs font-bold transition-all duration-300 ${
                    tab === item.id
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <>
                {/* Active benefits — GET /api/membership/benefits */}
                <section className="mt-5">
                  <h2 className="text-sm font-bold tracking-tight text-foreground">
                    Your benefits
                  </h2>
                  {membership.benefits.length === 0 ? (
                    <div className="mt-3">
                      <EmptyState
                        icon={Gift}
                        title="No member benefits yet"
                        description="Subscribe to Silver, Gold or Premium to unlock free pickup, free delivery and extra discounts."
                        actionLabel="See plans"
                        onAction={() => setTab("plans")}
                      />
                    </div>
                  ) : (
                    <ul className="card-soft mt-3 space-y-3 border border-border px-4 py-4">
                      {membership.benefits.map((benefit) => (
                        <BenefitRow
                          key={benefit.id}
                          title={benefit.title}
                          description={benefit.description}
                          icon={benefit.icon}
                        />
                      ))}
                    </ul>
                  )}
                </section>

                {/* Renew / cancel — POST /api/membership/subscribe | /cancel */}
                <section className="mt-6 space-y-3">
                  <button
                    type="button"
                    disabled={pendingPlan !== null}
                    onClick={() =>
                      activePlan && activePlan.id !== "free"
                        ? void handleSubscribe(activePlan.id)
                        : setTab("plans")
                    }
                    className="ripple flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.97] disabled:opacity-60"
                  >
                    {pendingPlan ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    {membership.active && membership.planId !== "free"
                      ? "Renew membership"
                      : "Choose a plan"}
                  </button>

                  {membership.canCancel ? (
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => void handleCancel()}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-bold text-muted-foreground transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
                    >
                      {cancelling ? <Loader2 className="size-4 animate-spin" /> : null}
                      Cancel membership
                    </button>
                  ) : null}
                </section>
              </>
            ) : null}

            {tab === "plans" ? (
              <section className="mt-5">
                <div className="flex gap-2 rounded-2xl bg-muted p-1">
                  {(["monthly", "yearly"] as BillingCycle[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCycle(item)}
                      className={`h-9 flex-1 rounded-xl text-xs font-bold capitalize transition-all duration-300 ${
                        cycle === item
                          ? "bg-background text-foreground shadow-soft"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {!plans || plans.plans.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      icon={Crown}
                      title="No plans available"
                      description="Membership plans couldn't be loaded right now."
                      actionLabel="Try again"
                      onAction={() => void load({ refresh: true })}
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {plans.plans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        cycle={cycle}
                        current={
                          membership.active &&
                          membership.planId === plan.id &&
                          membership.billingCycle === cycle
                        }
                        busy={pendingPlan === plan.id}
                        onSubscribe={(planId) => void handleSubscribe(planId)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {tab === "history" ? (
              <section className="mt-5">
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Membership history
                </h2>

                {historyLoading && !history ? <MembershipHistorySkeleton /> : null}

                {!historyLoading && historyError && !history ? (
                  <div className="mt-3">
                    <EmptyState
                      icon={CloudOff}
                      title="History didn't load"
                      description={historyError}
                      actionLabel="Try again"
                      onAction={() => void loadHistory({ refresh: true })}
                    />
                  </div>
                ) : null}

                {history && history.items.length === 0 ? (
                  <div className="mt-3">
                    <EmptyState
                      icon={CreditCard}
                      title="No membership activity yet"
                      description="Your subscriptions, renewals and payments will appear here."
                      actionLabel="See plans"
                      onAction={() => setTab("plans")}
                    />
                  </div>
                ) : null}

                {history && history.items.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {history.items.map((item) => (
                      <article
                        key={item.id}
                        className="card-soft border border-border px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold capitalize text-foreground">
                              {item.planName} · {item.type}
                            </p>
                            <p className="mt-1 text-[0.7rem] text-muted-foreground">
                              Subscribed {item.subscribedLabel}
                            </p>
                            {item.renewalAt ? (
                              <p className="text-[0.7rem] text-muted-foreground">
                                Renewed {item.renewalLabel}
                              </p>
                            ) : null}
                            <p className="text-[0.7rem] text-muted-foreground">
                              Expires {item.expiresLabel}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-black text-foreground">
                              {formatMembershipPrice(item.amount)}
                            </p>
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
                              {item.paymentStatus === "paid" ? <Check className="size-3" /> : null}
                              {item.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      <BottomNav />
      <Toaster />
    </main>
  );
}
