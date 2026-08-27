import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgePercent,
  Banknote,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Home,
  Loader2,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { toast } from "sonner";

import { CheckoutSkeleton } from "@/components/cart/CartSkeleton";
import { Toaster } from "@/shared/ui/sonner";
import { Textarea } from "@/shared/ui/textarea";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  applyCoupon,
  fetchInstructionChips,
  getCartState,
  setCartState,
  type Address,
  type CartData,
  type PickupOption,
} from "@/api/customer/cart-api";
import {
  fetchCheckoutCompat,
  placeOrder as postOrder,
  type CheckoutPaymentMethod,
} from "@/api/customer/checkout-api";
import { fetchRazorpayConfig, payWithRazorpay, type PayResult } from "@/api/payments/razorpay-api";
import { fetchWalletLedger } from "@/api/payments/wallet-ledger-api";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Schedule Your QuickPress Laundry Pickup" },
      {
        name: "description",
        content:
          "Confirm your pickup address, choose a pickup slot and payment method, then place your QuickPress laundry order in seconds.",
      },
      { property: "og:title", content: "Checkout — Schedule Your QuickPress Laundry Pickup" },
      {
        property: "og:description",
        content:
          "Pick an address, schedule pickup and delivery, choose payment and place your QuickPress order.",
      },
    ],
  }),
  component: CheckoutScreen,
});

const ADDRESS_ICONS = { Home, Office: Briefcase, Other: MapPin } as const;
const PAYMENT_ICONS = {
  upi: Smartphone,
  credit: Smartphone,
  debit: Smartphone,
  wallet: Wallet,
  cod: Banknote,
  online: Smartphone,
} as const;

function newOrderKey() {
  return `chk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function CheckoutScreen() {
  const { isAuthenticated, isLoading } = useAuthGuard();
  const navigate = useNavigate();
  const [data, setData] = useState<CartData | null>(getCartState().data);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [payments, setPayments] = useState<CheckoutPaymentMethod[] | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [deliveryEstimate, setDeliveryEstimate] = useState("");

  const [days, setDays] = useState<PickupOption[]>([]);
  const [slots, setSlots] = useState<PickupOption[]>([]);
  const [addressId, setAddressId] = useState("");
  const [day, setDay] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [express, setExpress] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderKey, setOrderKey] = useState(newOrderKey);

  // Instructions & Care notes
  const [chips, setChips] = useState<string[]>([]);
  const [instructions, setInstructions] = useState(getCartState().instructions || "");

  // Coupon / Promo Code
  const [couponCode, setCouponCode] = useState(getCartState().couponCode ?? "");
  const [appliedCode, setAppliedCode] = useState<string | null>(getCartState().couponCode);
  const [couponDiscount, setCouponDiscount] = useState(getCartState().couponDiscount || 0);
  const [applying, setApplying] = useState(false);

  // Live wallet balance + gateway mode for the real payment step.
  const walletLedgerQuery = useQuery({
    queryKey: ["wallet", "ledger", "checkout"],
    queryFn: () => fetchWalletLedger({ limit: 1 }),
  });
  const razorpayConfigQuery = useQuery({
    queryKey: ["razorpay", "config"],
    queryFn: fetchRazorpayConfig,
  });
  const liveWalletBalance = walletLedgerQuery.data?.balance ?? walletBalance;

  type PayMode = "razorpay" | "wallet" | "mixed" | "cod";
  const [payMode, setPayMode] = useState<PayMode>("razorpay");
  const [payResult, setPayResult] = useState<PayResult | null>(null);

  const payMutation = useMutation({
    mutationFn: (input: { amount: number; walletAmount: number; orderId: string }) =>
      payWithRazorpay({
        amount: input.amount,
        orderId: input.orderId,
        walletAmount: input.walletAmount,
        purpose: "Order payment",
        description: "QuickPress laundry order",
      }),
  });

  // Load instructions chips
  useEffect(() => {
    let alive = true;
    void fetchInstructionChips().then((next) => {
      if (alive) setChips(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  const loadCheckout = (discount: number) => {
    void fetchCheckoutCompat(discount)
      .then((checkout) => {
        setData(checkout.cart);
        setCartState({ data: checkout.cart });
        setAddresses(checkout.addresses);
        setPayments(checkout.payments);
        setWalletBalance(checkout.walletBalance);
        setDeliveryEstimate(checkout.deliveryEstimate);
        setDays(checkout.days);
        setSlots(checkout.slots);
        setAddressId((prev) => prev || checkout.selectedAddressId);
        const effectivePaymentId =
          checkout.selectedPaymentId || (checkout.payments?.find((p) => p.enabled)?.id ?? "");
        setPaymentId((prev) => prev || effectivePaymentId);
        const selectedMethod = checkout.payments?.find(
          (p) => p.id === (effectivePaymentId || checkout.selectedPaymentId),
        );
        if (selectedMethod?.kind === "cod") setPayMode("cod");
        else if (selectedMethod?.kind === "wallet") setPayMode("wallet");
        else setPayMode("razorpay");
        setDay((prev) => prev || checkout.selectedDay);
        setSlot((prev) => prev || checkout.selectedSlot);
      })
      .catch(() => {
        toast.error("Couldn't load checkout. Pull down to retry.");
      });
  };

  useEffect(() => {
    loadCheckout(couponDiscount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponDiscount]);

  // Apply Coupon action on Checkout
  const onApplyCoupon = async (code: string) => {
    if (!data || !code.trim()) return;
    setApplying(true);
    setCouponCode(code);
    try {
      await applyCoupon(code);
      const match = data.coupons.find(
        (coupon) => coupon.code.toLowerCase() === code.trim().toLowerCase(),
      );
      const discount = match?.discount ?? 0;
      setAppliedCode(match ? match.code : code);
      setCouponDiscount(discount);
      setCartState({ couponCode: match ? match.code : code, couponDiscount: discount });
      loadCheckout(discount);
      toast.success(discount > 0 ? `${code} applied! ₹${discount} saved.` : `${code} applied!`);
    } catch {
      toast.error("Invalid coupon code.");
    } finally {
      setApplying(false);
    }
  };

  // Delivery estimate is computed by the backend
  const [estimateDate = "", estimateTime = ""] = deliveryEstimate.split(" · ");
  const deliveryDate = express ? "Tomorrow" : estimateDate || "—";
  const deliveryTime = express ? "By 10 AM" : estimateTime || "—";

  // Backend authoritative totals: Single Source of Truth
  const totals = data?.totals ?? null;
  const ready = Boolean(data && addresses && payments && totals);

  if (!ready || !data || !addresses || !payments || !totals) {
    return (
      <main className="relative min-h-screen overflow-x-hidden bg-white dark:bg-zinc-950 scroll-smooth">
        <div className="relative mx-auto w-full max-w-md">
          <header className="sticky top-0 z-30 mx-auto w-full max-w-md">
            <div className="glass-panel flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                aria-label="Go back"
                onClick={() => navigate({ to: "/cart" })}
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
              >
                <ArrowLeft className="size-5" />
              </button>
              <p className="min-w-0 flex-1 truncate text-center text-sm font-bold tracking-tight text-foreground">
                Checkout
              </p>
              <span className="size-10 shrink-0" />
            </div>
          </header>
          <CheckoutSkeleton />
        </div>
        <Toaster />
      </main>
    );
  }

  const grandTotal = totals.grandTotal;
  const walletCoverage = Math.min(liveWalletBalance, grandTotal);
  const codMethod = payments.find((entry) => entry.kind === "cod" && entry.enabled);

  // Creates the QuickPress order once the payment step has settled
  const finalizeOrder = async (method: CheckoutPaymentMethod) => {
    setPlacing(true);
    try {
      const result = await postOrder({
        addressId,
        address: addresses.find((entry) => entry.id === addressId),
        items: data.items,
        pickup: { day, slot, express },
        payment: method,
        couponCode: appliedCode ?? undefined,
        couponDiscount,
        instructions,
        idempotencyKey: orderKey,
      });
      setPlacing(false);
      setPlaced(true);
      setCartState({ data: null, couponDiscount: 0, couponCode: null, instructions: "" });
      window.setTimeout(() => {
        setPlaced(false);
        void navigate({ to: "/order-success/$orderId", params: { orderId: result.orderId } });
      }, 900);
    } catch (err) {
      setPlacing(false);
      setOrderKey(newOrderKey());
      const msg = err instanceof Error ? err.message : "We couldn't place your order. Please try again.";
      toast.error(msg);
    }
  };

  // Place order trigger
  const placeOrder = async () => {
    if (placing || payMutation.isPending) return;
    if (!addressId) {
      toast.error("Add a pickup address to place your order.");
      return;
    }
    if (!day || !slot) {
      toast.error("Choose a pickup day and time slot.");
      return;
    }

    const selectedMethod = payments.find((entry) => entry.id === paymentId) || codMethod;
    const effectiveKind = selectedMethod?.kind || payMode;

    // Direct checkout for Cash on Delivery
    if (effectiveKind === "cod" || payMode === "cod") {
      const codPayload =
        selectedMethod?.kind === "cod"
          ? selectedMethod
          : codMethod || {
              id: "cod",
              kind: "cod",
              name: "Cash on Delivery",
              note: "Pay when clothes are picked up or delivered",
              enabled: true,
              comingSoon: false,
            };
      await finalizeOrder(codPayload);
      return;
    }

    // Direct wallet payment if fully covered
    if (effectiveKind === "wallet" && liveWalletBalance >= grandTotal) {
      const walletPayload = selectedMethod || {
        id: "wallet",
        kind: "wallet",
        name: "Wallet",
        note: "Paid from QuickPress wallet balance",
        enabled: true,
        comingSoon: false,
      };
      await finalizeOrder(walletPayload);
      return;
    }

    if (effectiveKind === "wallet" && liveWalletBalance < grandTotal) {
      toast.error("Your wallet balance isn't enough — choose UPI / Card or Cash on Delivery.");
      return;
    }

    // Online Payments (UPI, Cards, NetBanking via Razorpay)
    setPayResult(null);
    const walletAmount =
      payMode === "wallet" ? grandTotal : payMode === "mixed" ? walletCoverage : 0;
    const result = await payMutation.mutateAsync({
      amount: grandTotal,
      walletAmount,
      orderId: orderKey,
    });
    setPayResult(result);

    if (result.status === "paid") {
      const syntheticKind =
        effectiveKind === "razorpay" || effectiveKind === "mixed"
          ? "upi"
          : (effectiveKind as "cod" | "credit" | "debit" | "wallet" | "upi");
      const syntheticMethod: CheckoutPaymentMethod = {
        id: `pay-${effectiveKind}`,
        kind: syntheticKind,
        name:
          selectedMethod?.name ||
          (effectiveKind === "wallet" ? "Wallet" : "UPI / Online Payment"),
        note: result.message,
        enabled: true,
        comingSoon: false,
      };
      await finalizeOrder(syntheticMethod);
    } else {
      setOrderKey(newOrderKey());
      toast.error(result.message);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white dark:bg-zinc-950 scroll-smooth">
      <div className="relative mx-auto w-full max-w-md">
        {/* Top app bar */}
        <header className="sticky top-0 z-30 mx-auto w-full max-w-md">
          <div className="glass-panel flex items-center gap-2 px-4 py-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate({ to: "/cart" })}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
            >
              <ArrowLeft className="size-5" />
            </button>
            <p className="min-w-0 flex-1 truncate text-center text-sm font-bold tracking-tight text-foreground">
              Checkout
            </p>
            <span className="size-10 shrink-0" />
          </div>
        </header>

        <div className="px-5 pb-44 pt-2 space-y-6">
          {/* 1. Pickup Address */}
          <section className="mt-2">
            <SectionHeading title="1. Pickup Address" />
            <div className="mt-3 space-y-3">
              {addresses.length === 0 ? (
                <p className="rounded-2xl bg-muted/70 px-4 py-3 text-[11px] text-muted-foreground">
                  No saved address yet — add one to schedule your pickup.
                </p>
              ) : null}
              {addresses.map((address) => {
                const Icon = ADDRESS_ICONS[address.label] || MapPin;
                const active = address.id === addressId;
                return (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => setAddressId(address.id)}
                    className={`card-soft flex w-full items-start gap-3 border p-4 text-left transition-all duration-300 active:scale-[0.985] ${
                      active
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-primary/60"
                    }`}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{address.label}</p>
                        {active ? (
                          <span className="animate-pop flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                            <Check className="size-2.5" /> Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {address.line}, {address.city}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{address.phone}</p>
                    </div>
                    <span
                      role="link"
                      aria-label="Edit address"
                      onClick={(event) => {
                        event.stopPropagation();
                        void navigate({ to: "/addresses" });
                      }}
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-accent"
                    >
                      <Pencil className="size-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/addresses" })}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/60 bg-primary/5 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary/10 active:scale-[0.985]"
            >
              <Plus className="size-4" /> Add new address
            </button>
          </section>

          {/* 2. Pickup Schedule & Express */}
          <section>
            <SectionHeading title="2. Pickup Schedule" />
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {days.map((entry) => (
                <Chip
                  key={entry.id}
                  active={day === entry.id}
                  onClick={() => setDay(entry.id)}
                  label={entry.label}
                  sub={entry.sub}
                  icon={CalendarDays}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {slots.map((entry) => (
                <Chip
                  key={entry.id}
                  active={slot === entry.id}
                  onClick={() => setSlot(entry.id)}
                  label={entry.label}
                  sub={entry.sub}
                  icon={Clock}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setExpress((prev) => !prev)}
              className={`card-soft mt-3 flex w-full items-center gap-3 border p-4 text-left transition-all duration-300 active:scale-[0.985] ${
                express ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
                  express ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <Zap className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">Express pickup</p>
                <p className="text-[11px] text-muted-foreground">
                  Rider reaches you within 30 minutes
                </p>
              </div>
              {express ? (
                <Check className="animate-pop size-4 shrink-0 text-primary" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              )}
            </button>
          </section>

          {/* 3. Delivery Schedule */}
          <section>
            <SectionHeading title="3. Estimated Delivery" />
            <div className="card-soft mt-3 grid grid-cols-2 gap-3 border border-border p-4">
              <Stat icon={CalendarDays} label="Delivery date" value={deliveryDate} />
              <Stat icon={Truck} label="Delivery time" value={deliveryTime} />
            </div>
          </section>

          {/* 4. Special Instructions */}
          <section>
            <SectionHeading title="4. Care Instructions" />
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    const next = instructions ? `${instructions}, ${chip}` : chip;
                    setInstructions(next);
                    setCartState({ instructions: next });
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[11px] font-semibold text-foreground transition-all hover:border-primary/60 active:scale-[0.94]"
                >
                  <MessageSquareText className="size-3" /> {chip}
                </button>
              ))}
            </div>
            <Textarea
              value={instructions}
              onChange={(event) => {
                setInstructions(event.target.value);
                setCartState({ instructions: event.target.value });
              }}
              placeholder="Add special instructions for your clothes (e.g. fold only, separate whites)…"
              aria-label="Special instructions"
              className="card-soft mt-3 min-h-24 resize-none border border-border px-4 py-3 text-sm shadow-soft focus-visible:border-primary"
            />
          </section>

          {/* 5. Coupons & Promo Codes */}
          <section>
            <SectionHeading title="5. Apply Coupon" />
            <div className="card-soft mt-3 border border-border p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-muted/60 px-3">
                  <Tag className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    aria-label="Promo code"
                    className="w-full min-w-0 bg-transparent text-sm font-semibold tracking-wide text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="button"
                  disabled={applying || !couponCode.trim()}
                  onClick={() => void onApplyCoupon(couponCode)}
                  className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-cta transition-all hover:brightness-[1.03] active:scale-[0.95] disabled:opacity-50"
                >
                  {applying ? <Loader2 className="size-4 animate-spin" /> : null}
                  Apply
                </button>
              </div>

              {appliedCode ? (
                <p className="animate-pop mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Check className="size-3.5" /> {appliedCode} applied · ₹{couponDiscount} off
                </p>
              ) : null}

              {data.coupons && data.coupons.length > 0 ? (
                <div className="mt-4 space-y-2.5 border-t border-dashed border-border pt-4">
                  {data.coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                        <BadgePercent className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-foreground">
                            {coupon.title}
                          </p>
                          {coupon.best ? (
                            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
                              <Sparkles className="size-2.5" /> Best
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {coupon.code} · {coupon.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void onApplyCoupon(coupon.code)}
                        className="shrink-0 rounded-full border border-primary px-3 py-1.5 text-[11px] font-bold text-primary transition-all hover:bg-primary/15 active:scale-[0.94]"
                      >
                        {appliedCode === coupon.code ? "Applied" : "Apply"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {/* 6. Payment Method Selection */}
          <section>
            <SectionHeading title="6. Payment Method" />
            <div className="mt-3 space-y-2.5">
              {payments.map((method) => {
                const Icon = PAYMENT_ICONS[method.kind] || Smartphone;
                const active = method.id === paymentId;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentId(method.id);
                      if (method.kind === "cod") setPayMode("cod");
                      else if (method.kind === "wallet") setPayMode("wallet");
                      else setPayMode("razorpay");
                    }}
                    disabled={!method.enabled}
                    className={`card-soft flex w-full items-center gap-3 border p-4 text-left transition-all duration-300 active:scale-[0.985] ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/60"
                    } ${method.enabled ? "" : "pointer-events-none opacity-55"}`}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{method.name}</p>
                        {method.comingSoon ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                            Soon
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {method.kind === "wallet" && method.enabled
                          ? `Balance ₹${walletBalance}`
                          : method.note}
                      </p>
                    </div>
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        active ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {active ? (
                        <Check className="animate-pop size-3 text-primary-foreground" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 7. Complete Order Summary & All Charges (Price Breakdown) */}
          <section>
            <SectionHeading title="7. Price Breakdown & Charges" />
            <div className="card-soft mt-3 border border-border p-4">
              {/* Services List */}
              <div className="space-y-2 border-b border-dashed border-border pb-3">
                {data.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {item.name} × {item.qty}
                    </span>
                    <span className="shrink-0 font-semibold text-foreground">
                      ₹{item.price * item.qty}
                    </span>
                  </div>
                ))}
              </div>

              {/* All Charges Calculated by Backend */}
              <div className="pt-2">
                <SummaryRow label="Items Total (Subtotal)" value={totals.itemsTotal} />
                <SummaryRow
                  label="Delivery Fee"
                  value={totals.delivery}
                  note={totals.delivery === 0 ? "FREE" : undefined}
                />
                <SummaryRow label="Handling Fee" value={totals.handling} />
                {totals.pickup > 0 ? (
                  <SummaryRow label="Pickup Charge" value={totals.pickup} />
                ) : null}
                {totals.gst > 0 ? <SummaryRow label="GST (5%)" value={totals.gst} /> : null}
                {totals.couponDiscount > 0 ? (
                  <SummaryRow
                    label="Coupon Discount"
                    value={-totals.couponDiscount}
                    tone="green"
                  />
                ) : null}
                {totals.discount > 0 ? (
                  <SummaryRow label="Store Discount" value={-totals.discount} tone="green" />
                ) : null}

                {/* Grand Total / Final Payable */}
                <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-3">
                  <div>
                    <span className="text-sm font-extrabold text-foreground">
                      Grand Total / Final Payable
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      All taxes and fees included
                    </p>
                  </div>
                  <span
                    key={totals.grandTotal}
                    className="animate-pop text-lg font-black text-primary"
                  >
                    ₹{totals.grandTotal}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Terms & Fabric Care */}
          <section className="pb-6">
            <div className="card-soft flex items-start gap-3 border border-border p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                By placing this order you agree to our{" "}
                <span className="font-semibold text-foreground">Terms &amp; Conditions</span> and
                QuickPress fabric care guarantee.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto w-full max-w-md px-4 pb-4">
          <div className="glass-panel animate-sheet-up flex items-center gap-3 rounded-3xl p-3 shadow-soft">
            <div className="min-w-0">
              <p
                key={totals.grandTotal}
                className="animate-pop text-lg font-black leading-tight text-foreground"
              >
                ₹{totals.grandTotal}
              </p>
              <p className="text-[11px] text-muted-foreground">Final payable amount</p>
            </div>
            <button
              type="button"
              onClick={() => void placeOrder()}
              disabled={placing}
              className="ml-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-3xl bg-primary text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.97] disabled:opacity-60"
            >
              {placing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : placed ? (
                <Check className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {placing ? "Placing order…" : placed ? "Order placed" : "Place Order"}
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h2>;
}

function Chip({
  active,
  onClick,
  label,
  sub,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  icon: typeof Clock;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border px-2 py-3 text-center transition-all duration-300 active:scale-[0.95] ${
        active
          ? "border-primary bg-primary/10 shadow-xs"
          : "border-border bg-muted/60 hover:border-primary/60"
      }`}
    >
      <span
        className={`mx-auto flex size-7 items-center justify-center rounded-full transition-colors duration-300 ${
          active ? "bg-primary text-primary-foreground" : "bg-card text-primary"
        }`}
      >
        <Icon className="size-3.5" />
      </span>
      <p className="mt-1.5 text-[11px] font-bold text-foreground">{label}</p>
      <p className="text-[9px] text-muted-foreground">{sub}</p>
    </button>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/70 px-3 py-2.5 text-center">
      <span className="mx-auto flex size-7 items-center justify-center rounded-full bg-card text-primary">
        <Icon className="size-3.5" />
      </span>
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p key={value} className="animate-pop text-xs font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note?: string | undefined;
  tone?: "green" | undefined;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {note ? (
          <span className="rounded-md bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary uppercase">
            {note}
          </span>
        ) : null}
        <span
          key={value}
          className={`animate-pop font-semibold ${
            tone === "green" ? "text-primary font-bold" : "text-foreground"
          }`}
        >
          {value < 0 ? `-₹${Math.abs(value)}` : `₹${value}`}
        </span>
      </div>
    </div>
  );
}
