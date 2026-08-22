import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { toast } from "sonner";

import { CheckoutSkeleton } from "@/components/cart/CartSkeleton";
import { Toaster } from "@/shared/ui/sonner";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
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
import { PaymentStatusCard, type PaymentUiStatus } from "@/components/payment/PaymentStatusCard";

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

  useEffect(() => {
    let alive = true;
    // GET /api/checkout — addresses, pickup slots, totals, payments in one read.
    void fetchCheckoutCompat(getCartState().couponDiscount)
      .then((checkout) => {
        if (!alive) return;
        setData(checkout.cart);
        setCartState({ data: checkout.cart });
        setAddresses(checkout.addresses);
        setPayments(checkout.payments);
        setWalletBalance(checkout.walletBalance);
        setDeliveryEstimate(checkout.deliveryEstimate);
        setDays(checkout.days);
        setSlots(checkout.slots);
        setAddressId((prev) => prev || checkout.selectedAddressId);
        setPaymentId((prev) => prev || checkout.selectedPaymentId);
        setDay((prev) => prev || checkout.selectedDay);
        setSlot((prev) => prev || checkout.selectedSlot);
      })
      .catch(() => {
        if (alive) toast.error("Couldn't load checkout. Pull down to retry.");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delivery estimate is computed by the backend ("Sat, 08 Aug · 4 PM – 8 PM").
  const [estimateDate = "", estimateTime = ""] = deliveryEstimate.split(" · ");
  const deliveryDate = express ? "Tomorrow" : estimateDate || "—";
  const deliveryTime = express ? "By 10 AM" : estimateTime || "—";

  // Totals come straight from the backend cart summary — never recomputed here.
  const totals = data?.totals ?? null;

  const ready = data && addresses && payments && totals;

  const grandTotal = totals?.grandTotal ?? 0;
  const walletCoverage = Math.min(liveWalletBalance, grandTotal);
  const codMethod = payments?.find((entry) => entry.kind === "cod" && entry.enabled);
  const paymentUiStatus: PaymentUiStatus | null =
    payMutation.isPending
      ? "verifying"
      : payResult
        ? payResult.status === "paid"
          ? "paid"
          : payResult.status
        : null;

  // Creates the QuickPress order once the payment step has settled.
  const finalizeOrder = async (method: CheckoutPaymentMethod) => {
    setPlacing(true);
    try {
      const result = await postOrder({
        addressId,
        address: addresses?.find((entry) => entry.id === addressId),
        items: data!.items,
        pickup: { day, slot, express },
        payment: method,
        couponDiscount: getCartState().couponDiscount,
        idempotencyKey: orderKey,
      });
      setPlacing(false);
      setPlaced(true);
      setCartState({ data: null, couponDiscount: 0 });
      window.setTimeout(() => {
        setPlaced(false);
        void navigate({ to: "/order-success/$orderId", params: { orderId: result.orderId } });
      }, 900);
    } catch {
      setPlacing(false);
      setOrderKey(newOrderKey());
      toast.error("We couldn't place your order. Please try again.");
    }
  };

  // POST /api/payments/razorpay/order → checkout → verify, then POST /api/orders
  const placeOrder = async () => {
    if (!ready || placing || payMutation.isPending) return;
    if (!addressId) {
      toast.error("Add a pickup address to place your order.");
      return;
    }
    if (!day || !slot) {
      toast.error("Choose a pickup day and time slot.");
      return;
    }

    if (payMode === "cod") {
      if (!codMethod) {
        toast.error("Cash on delivery isn't available right now.");
        return;
      }
      await finalizeOrder(codMethod);
      return;
    }

    if (payMode === "wallet" && liveWalletBalance < grandTotal) {
      toast.error("Your wallet balance isn't enough — choose Razorpay or Mixed.");
      return;
    }

    setPayResult(null);
    const walletAmount = payMode === "wallet" ? grandTotal : payMode === "mixed" ? walletCoverage : 0;
    const result = await payMutation.mutateAsync({ amount: grandTotal, walletAmount, orderId: orderKey });
    setPayResult(result);

    if (result.status === "paid") {
      const syntheticMethod: CheckoutPaymentMethod = {
        id: `pay-${payMode}`,
        kind: payMode === "razorpay" ? "upi" : "wallet",
        name: payMode === "wallet" ? "Wallet" : payMode === "mixed" ? "Wallet + Razorpay" : "Razorpay",
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

  const retryPayment = () => {
    setPayResult(null);
    void placeOrder();
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background scroll-smooth">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

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

        {!ready ? (
          <>
            <CheckoutSkeleton />
          </>
        ) : (
          <div className="px-5 pb-44 pt-2">
            {/* Pickup address — GET /api/addresses */}
            <section className="mt-2">
              <SectionHeading title="Pickup address" />
              <div className="mt-4 space-y-3">
                {addresses.length === 0 ? (
                  <p className="rounded-2xl bg-muted/70 px-4 py-3 text-[11px] text-muted-foreground">
                    No saved address yet — add one to schedule your pickup.
                  </p>
                ) : null}
                {addresses.map((address) => {
                  const Icon = ADDRESS_ICONS[address.label];
                  const active = address.id === addressId;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setAddressId(address.id)}
                      className={`card-soft flex w-full items-start gap-3 border p-4 text-left transition-all duration-300 active:scale-[0.985] ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/60"
                      }`}
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{address.label}</p>
                          {active ? (
                            <span className="animate-pop flex items-center gap-1 rounded-full bg-brand-green px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-background">
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
              {/* Address CRUD lives on the saved addresses screen */}
              <button
                type="button"
                onClick={() => navigate({ to: "/addresses" })}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/60 bg-primary/5 text-sm font-bold text-brand-dark transition-all duration-300 hover:bg-primary/10 active:scale-[0.985]"
              >
                <Plus className="size-4" /> Add new address
              </button>
            </section>

            {/* Pickup schedule */}
            <section className="mt-8">
              <SectionHeading title="Pickup schedule" />
              <div className="mt-4 grid grid-cols-3 gap-2.5">
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
                  <Check className="animate-pop size-4 shrink-0 text-brand-green" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            </section>

            {/* Delivery schedule */}
            <section className="mt-8">
              <SectionHeading title="Delivery schedule" />
              <div className="card-soft mt-4 grid grid-cols-2 gap-3 border border-border p-4">
                <Stat
                  icon={CalendarDays}
                  label="Delivery date"
                  value={deliveryDate}
                />
                <Stat icon={Truck} label="Delivery time" value={deliveryTime} />
              </div>
            </section>

            {/* Payment method — GET /api/payment-methods */}
            <section className="mt-8">
              <SectionHeading title="Payment method" />
              <div className="mt-4 space-y-2.5">
                {payments.map((method) => {
                  const Icon = PAYMENT_ICONS[method.kind];
                  const active = method.id === paymentId;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentId(method.id)}
                      disabled={!method.enabled}
                      className={`card-soft flex w-full items-center gap-3 border p-4 text-left transition-all duration-300 active:scale-[0.985] ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/60"
                      } ${method.enabled ? "" : "pointer-events-none opacity-55"}`}
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
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

              <button
                type="button"
                onClick={() => navigate({ to: "/payment-methods" })}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/60 bg-primary/5 text-sm font-bold text-brand-dark transition-all duration-300 hover:bg-primary/10 active:scale-[0.985]"
              >
                <Plus className="size-4" /> Add payment method
              </button>
            </section>

            {/* Order summary */}
            <section className="mt-8">
              <SectionHeading title="Order summary" />
              <div className="card-soft mt-4 border border-border p-4">
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
                <div className="pt-2">
                  <SummaryRow label="Subtotal" value={totals.itemsTotal} />
                  <SummaryRow label="Pickup" value={totals.pickup} />
                  <SummaryRow label="Delivery" value={totals.delivery} />
                  <SummaryRow label="Handling fee" value={totals.handling} />
                  <SummaryRow label="GST (5%)" value={totals.gst} />
                  <SummaryRow
                    label="Discount"
                    value={-(totals.discount + totals.couponDiscount)}
                    tone="green"
                  />
                  <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-3">
                    <span className="text-sm font-bold text-foreground">Grand total</span>
                    <span
                      key={totals.grandTotal}
                      className="animate-pop text-base font-bold text-foreground"
                    >
                      ₹{totals.grandTotal}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Terms */}
            <section className="mt-6">
              <div className="card-soft flex items-start gap-3 border border-border p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                  <ShieldCheck className="size-4" />
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  By placing this order you agree to our{" "}
                  <span className="font-semibold text-foreground">Terms &amp; Conditions</span> and
                  QuickPress fabric care policy.
                </p>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {ready ? (
        <div className="fixed inset-x-0 bottom-0 z-30">
          <div className="mx-auto w-full max-w-md px-4 pb-4">
            <div className="glass-panel animate-sheet-up flex items-center gap-3 rounded-3xl p-3 shadow-soft">
              <div className="min-w-0">
                <p
                  key={totals.grandTotal}
                  className="animate-pop text-lg font-bold leading-tight text-foreground"
                >
                  ₹{totals.grandTotal}
                </p>
                <p className="text-[11px] text-muted-foreground">Grand total</p>
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
      ) : null}
      <Toaster />
    </main>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>;
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
          ? "border-primary bg-primary/10"
          : "border-border bg-muted/60 hover:border-primary/60"
      }`}
    >
      <span
        className={`mx-auto flex size-7 items-center justify-center rounded-full transition-colors duration-300 ${
          active ? "bg-primary text-primary-foreground" : "bg-card text-brand-green"
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
      <span className="mx-auto flex size-7 items-center justify-center rounded-full bg-card text-brand-green">
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

function SummaryRow({ label, value, tone }: { label: string; value: number; tone?: "green" }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        key={value}
        className={`animate-pop font-semibold ${tone === "green" ? "text-brand-green" : "text-foreground"}`}
      >
        {value < 0 ? `-₹${Math.abs(value)}` : `₹${value}`}
      </span>
    </div>
  );
}
