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
  Crown,
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
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CheckoutSkeleton } from "@/components/cart/CartSkeleton";
import { fetchProfile } from "@/api/customer/services/profile-service";
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
import { clearCartLines } from "@/api/customer/cart-store";
import {
  fetchCheckoutCompat,
  placeOrder as postOrder,
  type CheckoutMembership,
  type CheckoutPaymentMethod,
} from "@/api/customer/checkout-api";
import { fetchRazorpayConfig, payWithRazorpay, type PayResult } from "@/api/payments/razorpay-api";
import { fetchWallet } from "@/api/customer/wallet-api";

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

const DEFAULT_ADDRESSES: Address[] = [
  { id: "addr-home", label: "Home", line: "Main Street, Sector 12", city: "Kasganj, UP", phone: "9876543210" },
  { id: "addr-office", label: "Office", line: "Tech Park, Building B", city: "Kasganj, UP", phone: "9876543210" },
];

const DEFAULT_PAYMENTS: CheckoutPaymentMethod[] = [
  { id: "pay-upi", kind: "upi", name: "UPI (Google Pay / PhonePe / Paytm)", note: "Instant zero-fee payment", enabled: true, comingSoon: false },
  { id: "pay-cod", kind: "cod", name: "Cash on Delivery", note: "Pay when clothes are picked up or delivered", enabled: true, comingSoon: false },
  { id: "pay-wallet", kind: "wallet", name: "QuickPress Wallet", note: "Pay from wallet balance", enabled: true, comingSoon: false },
];

function CheckoutScreen() {
  const { isAuthenticated, isLoading } = useAuthGuard();
  const navigate = useNavigate();
  const [data, setData] = useState<CartData | null>(getCartState().data);
  const [addresses, setAddresses] = useState<Address[]>(DEFAULT_ADDRESSES);
  const [payments, setPayments] = useState<CheckoutPaymentMethod[]>(DEFAULT_PAYMENTS);
  const [membership, setMembership] = useState<CheckoutMembership | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [deliveryEstimate, setDeliveryEstimate] = useState("");

  const [days, setDays] = useState<PickupOption[]>([
    { id: "today", label: "Today", sub: "Fastest pickup" },
    { id: "tomorrow", label: "Tomorrow", sub: "Standard" },
  ]);
  const [slots, setSlots] = useState<PickupOption[]>([
    { id: "slot-1", label: "08:00 AM - 12:00 PM", sub: "Morning slot" },
    { id: "slot-2", label: "04:00 PM - 08:00 PM", sub: "Evening slot" },
  ]);
  const [addressId, setAddressId] = useState("addr-home");
  const [day, setDay] = useState<string>("today");
  const [slot, setSlot] = useState<string>("08:00 AM - 12:00 PM");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [express, setExpress] = useState(false);
  const [paymentId, setPaymentId] = useState("pay-upi");
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
  const walletQuery = useQuery({
    queryKey: ["wallet", "live", "checkout"],
    queryFn: () => fetchWallet(),
  });
  const liveWalletBalance = walletQuery.data?.balances?.currentBalance ?? walletBalance;

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

  // Auto-fill customer name & phone from profile
  useEffect(() => {
    let alive = true;
    void fetchProfile().then((res) => {
      if (!alive) return;
      const profile = "data" in res ? res.data : res;
      if (profile?.name && !customerName) {
        setCustomerName(profile.name);
      }
      if (profile?.phone && !customerPhone) {
        setCustomerPhone(profile.phone);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Auto-fill phone from selected address if profile phone is empty
  useEffect(() => {
    const selected = addresses?.find((a) => a.id === addressId);
    if (selected?.phone && !customerPhone) {
      setCustomerPhone(selected.phone);
    }
  }, [addressId, addresses, customerPhone]);

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
        if (checkout.cart) {
          setData(checkout.cart);
          setCartState({ data: checkout.cart });
        }
        if (checkout.addresses?.length) {
          setAddresses(checkout.addresses);
          setAddressId((prev) => (prev && checkout.addresses.some(a => a.id === prev)) ? prev : checkout.selectedAddressId || checkout.addresses[0].id);
        }
        if (checkout.payments?.length) {
          setPayments(checkout.payments);
        }
        setWalletBalance(checkout.walletBalance);
        setDeliveryEstimate(checkout.deliveryEstimate);
        if (checkout.membership) setMembership(checkout.membership);
        if (checkout.days?.length) setDays(checkout.days);
        if (checkout.slots?.length) setSlots(checkout.slots);

        const effectivePaymentId =
          checkout.selectedPaymentId || (checkout.payments?.find((p) => p.enabled)?.id ?? "");
        if (effectivePaymentId) setPaymentId((prev) => prev || effectivePaymentId);
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
        // Keep default fallback state
      });
  };

  useEffect(() => {
    loadCheckout(couponDiscount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponDiscount]);

  // Apply Coupon action on Checkout
  const onApplyCoupon = async (code: string) => {
    if (!code.trim()) return;
    setApplying(true);
    setCouponCode(code);
    try {
      await applyCoupon(code);
      const match = data?.coupons?.find(
        (coupon) => coupon.code.toLowerCase() === code.trim().toLowerCase(),
      );
      const discount = match?.discount ?? 50;
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

  // Delivery estimate
  const [estimateDate = "", estimateTime = ""] = deliveryEstimate.split(" · ");
  const deliveryDate = express ? "Tomorrow" : estimateDate || "Tomorrow";
  const deliveryTime = express ? "By 10 AM" : estimateTime || "08:00 AM - 12:00 PM";

  // Authoritative & local totals
  const totals = data?.totals ?? getCartState().data?.totals ?? {
    count: 1,
    itemsTotal: 199,
    pickup: 0,
    delivery: 0,
    handling: 5,
    gst: 36,
    discount: 0,
    couponDiscount: couponDiscount,
    grandTotal: Math.max(0, 199 + 5 + 36 - couponDiscount),
  };

  const grandTotal = totals.grandTotal;
  const walletCoverage = Math.min(liveWalletBalance, grandTotal);
  const codMethod = payments.find((entry) => entry.kind === "cod" && entry.enabled);

  // Creates order on backend
  const finalizeOrder = async (method: CheckoutPaymentMethod) => {
    if (!customerName.trim()) {
      toast.error("Please enter your full name.");
      setPlacing(false);
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      setPlacing(false);
      return;
    }

    setPlacing(true);
    try {
      const result = await postOrder({
        addressId,
        address: addresses.find((entry) => entry.id === addressId),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: data?.items ?? [],
        pickup: { day: day || "today", slot: slot || "08:00 AM - 08:00 PM", express },
        payment: method,
        couponCode: appliedCode ?? undefined,
        couponDiscount,
        instructions,
        idempotencyKey: orderKey,
      });
      setPlacing(false);
      setPlaced(true);
      clearCartLines();
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
    if (!customerName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    const selectedMethod = payments.find((entry) => entry.id === paymentId) || codMethod;
    const effectiveKind = selectedMethod?.kind || payMode;

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
      toast.error("Your wallet balance isn't enough — choose UPI or Cash on Delivery.");
      return;
    }

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
        name: selectedMethod?.name || "UPI / Online Payment",
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

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      void navigate({ to: "/home" });
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 text-foreground pb-40">
      <div className="mx-auto w-full max-w-md">
        {/* Top App Bar matching Application Header Theme */}
        <header className="sticky top-0 z-40 mx-auto w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-border/60">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={handleBack}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-transform active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="size-4.5" />
            </button>

            <div className="text-center min-w-0 flex-1">
              <h1 className="text-sm font-black tracking-tight text-foreground truncate">
                Instant Checkout
              </h1>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Zap className="size-3 fill-emerald-500 text-emerald-500 animate-pulse" />
                <span>QuickPress Doorstep Pickup</span>
              </p>
            </div>

            <span className="size-9 shrink-0" />
          </div>
        </header>

        <div className="px-4 pt-3 space-y-4">
          {/* Top Savings Highlight Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 p-3.5 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
                <Sparkles className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black tracking-wide">
                  ⚡ 15-30 Min Pickup Partner Assignment
                </p>
                <p className="text-[10px] text-white/90 font-medium mt-0.5">
                  Verified doorstep laundry pickup & 100% garment safety guarantee
                </p>
              </div>
            </div>
          </div>

          {/* 1. Pickup Address Selection */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                  1. Pickup Address
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/addresses" })}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3.5" /> Add New
              </button>
            </div>

            <div className="space-y-2.5">
              {addresses.map((address) => {
                const Icon = ADDRESS_ICONS[address.label] || MapPin;
                const active = address.id === addressId;
                return (
                  <div
                    key={address.id}
                    onClick={() => setAddressId(address.id)}
                    className={`rounded-2xl border p-3.5 flex items-start gap-3 transition-all cursor-pointer ${
                      active
                        ? "border-2 border-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-xs"
                        : "border-border bg-card hover:border-emerald-500/40"
                    }`}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground">{address.label}</p>
                        {active ? (
                          <span className="flex items-center gap-1 rounded-md bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                            <Check className="size-2.5" /> Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                        {address.line}, {address.city}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                        Phone: {address.phone}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label="Edit address"
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigate({ to: "/addresses" });
                      }}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-accent active:scale-90 transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Contact Details */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                2. Contact Details (Required)
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground">
                    <User className="size-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-muted/40 pl-10 pr-3 text-xs font-bold text-foreground focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Mobile Number <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground">
                    <Smartphone className="size-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={14}
                    placeholder="Enter 10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-muted/40 pl-10 pr-3 text-xs font-bold text-foreground focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="size-3" /> Auto-saved to your profile & order receipt
                </p>
              </div>
            </div>
          </section>

          {/* 3. Delivery Schedule & Slot */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                  3. Pickup Date & Time Slot
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setExpress(!express)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition-all cursor-pointer ${
                  express ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                ⚡ {express ? "Express Pickup On" : "Express 2-Hr"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Delivery Date
                </span>
                <span className="text-xs font-black text-foreground mt-0.5 block">
                  {deliveryDate}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Pickup Slot
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {deliveryTime}
                </span>
              </div>
            </div>
          </section>

          {/* 4. Special Care Instructions */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                4. Care Instructions
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    const next = instructions ? `${instructions}, ${chip}` : chip;
                    setInstructions(next);
                    setCartState({ instructions: next });
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="size-3 text-emerald-600" /> {chip}
                </button>
              ))}
            </div>
            <Textarea
              value={instructions}
              onChange={(event) => {
                setInstructions(event.target.value);
                setCartState({ instructions: event.target.value });
              }}
              placeholder="Custom care instructions (e.g. fold only, delicate silk, separate whites)..."
              className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[70px]"
            />
          </section>

          {/* 5. Membership Card */}
          {membership?.active ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  <Crown className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-black text-foreground">
                    {membership.badge || `${membership.planName} VIP`}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Active Member · ₹0 Delivery & Member Discounts Applied
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Crown className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Get Free Delivery & Member Discounts</p>
                  <p className="text-[10px] text-muted-foreground">Join QuickPress VIP from ₹99/month</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/membership" })}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-[10px] font-black text-white shadow-xs active:scale-95 cursor-pointer"
              >
                View Plans
              </button>
            </div>
          )}

          {/* 6. Coupons & Offers */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                  5. Promo Code & Offers
                </h2>
              </div>
              {appliedCode ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCode(null);
                    setCouponDiscount(0);
                    setCouponCode("");
                    setCartState({ couponCode: null, couponDiscount: 0 });
                  }}
                  className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
                >
                  Remove
                </button>
              ) : null}
            </div>

            {appliedCode ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-600" /> Code '{appliedCode}' Applied!
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">-₹{couponDiscount}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter promo code (e.g. QUICK50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  disabled={!couponCode.trim() || applying}
                  onClick={() => void onApplyCoupon(couponCode)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2 text-xs font-black text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  {applying ? "Applying..." : "APPLY"}
                </button>
              </div>
            )}
          </section>

          {/* 7. Payment Methods */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                6. Payment Method
              </h2>
            </div>

            <div className="space-y-2.5">
              {payments.map((method) => {
                const Icon = PAYMENT_ICONS[method.kind] || Smartphone;
                const active = method.id === paymentId;
                return (
                  <div
                    key={method.id}
                    onClick={() => {
                      if (!method.enabled) return;
                      setPaymentId(method.id);
                      if (method.kind === "cod") setPayMode("cod");
                      else if (method.kind === "wallet") setPayMode("wallet");
                      else setPayMode("razorpay");
                    }}
                    className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      active
                        ? "border-2 border-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-xs"
                        : "border-border bg-card hover:border-emerald-500/40"
                    } ${method.enabled ? "" : "opacity-50 pointer-events-none"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          active ? "bg-emerald-600 text-white shadow-xs" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">{method.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {method.kind === "wallet" ? `Balance ₹${liveWalletBalance}` : method.note}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        active ? "border-emerald-600 bg-emerald-600 text-white" : "border-border"
                      }`}
                    >
                      {active ? <Check className="size-3" /> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 8. Blinkit Price Breakdown & Bill Details Card */}
          <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground pb-1 border-b border-border/50">
              7. Price Breakdown & Bill Details
            </h2>

            {/* Items Summary */}
            {data?.items && data.items.length > 0 ? (
              <div className="space-y-1.5 pb-2 border-b border-border/40 text-xs">
                {data.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-muted-foreground">
                    <span className="truncate">{item.name} × {item.qty}</span>
                    <span className="font-bold text-foreground">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Items Total</span>
                <span className="font-bold text-foreground">₹{totals.itemsTotal}</span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Delivery Partner Fee
                  {totals.delivery === 0 ? (
                    <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      FREE
                    </span>
                  ) : null}
                </span>
                <span>{totals.delivery === 0 ? "FREE" : `₹${totals.delivery}`}</span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Handling & Platform Fee</span>
                <span>₹{totals.handling}</span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Taxes & GST (18%)</span>
                <span>₹{totals.gst}</span>
              </div>

              {couponDiscount > 0 ? (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              ) : null}

              <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-black text-foreground">
                <span>Total Amount Payable</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400">₹{grandTotal}</span>
              </div>
            </div>
          </section>

          {/* Guarantee Note */}
          <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs flex items-start gap-3">
            <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              By placing this order you agree to QuickPress Terms & Conditions and 100% doorstep fabric care guarantee.
            </p>
          </div>
        </div>

        {/* Sticky Bottom Action Bar (Blinkit / Application Style) */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-zinc-900/95 border-t border-border/80 p-3 shadow-2xl backdrop-blur-md">
          <div className="mx-auto w-full max-w-md flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Payable
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-foreground">₹{grandTotal}</span>
                {couponDiscount > 0 ? (
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    Saved ₹{couponDiscount}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void placeOrder()}
              disabled={placing}
              className="flex-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {placing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : placed ? (
                <Check className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
              <span>{placing ? "Placing Order..." : placed ? "Order Placed!" : `Place Order & Pay ₹${grandTotal}`}</span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
