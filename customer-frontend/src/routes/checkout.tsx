import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgePercent,
  Banknote,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Crown,
  CreditCard,
  Home,
  Loader2,
  MapPin,
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

import { fetchProfile } from "@/api/customer/services/profile-service";
import { Toaster } from "@/shared/ui/sonner";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  applyCoupon,
  getCartState,
  setCartState,
  type Address,
  type CartData,
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
      { title: "Checkout — QuickPress Laundry Pickup & Delivery" },
      {
        name: "description",
        content:
          "Confirm your pickup and delivery address and payment method to place your QuickPress order instantly.",
      },
      { property: "og:title", content: "Checkout — QuickPress" },
    ],
  }),
  component: CheckoutScreen,
});

const ADDRESS_ICONS = { Home, Office: Briefcase, Other: MapPin } as const;

function newOrderKey() {
  return `chk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_ADDRESSES: Address[] = [
  { id: "addr-home", label: "Home", line: "Main Street, Sector 12", city: "Kasganj, UP", phone: "9876543210" },
  { id: "addr-office", label: "Office", line: "Tech Park, Building B", city: "Kasganj, UP", phone: "9876543210" },
];

const BLINKIT_PAYMENT_METHODS: CheckoutPaymentMethod[] = [
  { id: "pay-upi", kind: "upi", name: "UPI (Google Pay, PhonePe, Paytm, CRED)", note: "Instant zero-fee payment via any UPI App", enabled: true, comingSoon: false },
  { id: "pay-card", kind: "credit", name: "Credit / Debit Cards", note: "Visa, Mastercard, RuPay, Maestro", enabled: true, comingSoon: false },
  { id: "pay-wallet", kind: "wallet", name: "QuickPress Wallet", note: "Pay instantly from wallet balance", enabled: true, comingSoon: false },
  { id: "pay-cod", kind: "cod", name: "Cash / Pay on Delivery", note: "Pay cash or UPI when order arrives", enabled: true, comingSoon: false },
];

function CheckoutScreen() {
  const { isAuthenticated, isLoading } = useAuthGuard();
  const navigate = useNavigate();
  const [data, setData] = useState<CartData | null>(getCartState().data);
  const [addresses, setAddresses] = useState<Address[]>(DEFAULT_ADDRESSES);
  const [payments, setPayments] = useState<CheckoutPaymentMethod[]>(BLINKIT_PAYMENT_METHODS);
  const [membership, setMembership] = useState<CheckoutMembership | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // Address selection state (Pickup & Delivery)
  const [pickupAddressId, setPickupAddressId] = useState("addr-home");
  const [sameAsPickup, setSameAsPickup] = useState(true);
  const [deliveryAddressId, setDeliveryAddressId] = useState("addr-home");

  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentId, setPaymentId] = useState("pay-upi");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderKey, setOrderKey] = useState(newOrderKey);

  // Coupon / Promo Code
  const [couponCode, setCouponCode] = useState(getCartState().couponCode ?? "");
  const [appliedCode, setAppliedCode] = useState<string | null>(getCartState().couponCode);
  const [couponDiscount, setCouponDiscount] = useState<number>(getCartState().couponDiscount || 0);
  const [applying, setApplying] = useState(false);

  // Live wallet balance query
  const walletQuery = useQuery({
    queryKey: ["wallet", "live", "checkout"],
    queryFn: () => fetchWallet(),
  });
  const liveWalletBalance = walletQuery.data?.balances?.currentBalance ?? walletBalance;

  type PayMode = "razorpay" | "wallet" | "cod";
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

  // Auto-fill customer profile details
  useEffect(() => {
    let alive = true;
    void fetchProfile().then((res) => {
      if (!alive) return;
      const profile = "data" in res ? res.data : res;
      if (profile?.name && !customerName) setCustomerName(profile.name);
      if (profile?.phone && !customerPhone) setCustomerPhone(profile.phone);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Auto-fill phone from address selection
  useEffect(() => {
    const selected = addresses?.find((a) => a.id === pickupAddressId);
    if (selected?.phone && !customerPhone) setCustomerPhone(selected.phone);
  }, [pickupAddressId, addresses, customerPhone]);

  // Sync delivery address with pickup if sameAsPickup is active
  useEffect(() => {
    if (sameAsPickup) {
      setDeliveryAddressId(pickupAddressId);
    }
  }, [pickupAddressId, sameAsPickup]);

  // Load authoritative checkout state
  const loadCheckout = (discount: number) => {
    void fetchCheckoutCompat(discount)
      .then((checkout) => {
        if (checkout.cart) {
          setData(checkout.cart);
          setCartState({ data: checkout.cart });
        }
        if (checkout.addresses?.length) {
          setAddresses(checkout.addresses);
          const initialId = checkout.selectedAddressId || checkout.addresses[0].id;
          setPickupAddressId((prev) => (prev && checkout.addresses.some(a => a.id === prev)) ? prev : initialId);
          setDeliveryAddressId((prev) => (prev && checkout.addresses.some(a => a.id === prev)) ? prev : initialId);
        }
        setWalletBalance(checkout.walletBalance);
        if (checkout.membership) setMembership(checkout.membership);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    loadCheckout(couponDiscount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponDiscount]);

  // Apply Coupon action
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

  // Pricing calculations
  const itemsSubtotal = data?.items?.reduce((sum, i) => sum + i.price * i.qty, 0) ?? 199;
  const totalMRP = data?.items?.reduce((sum, i) => sum + Math.round(i.price * 1.25) * i.qty, 0) ?? 249;
  const deliveryFee = 0; // FREE Delivery for QuickPress
  const handlingFee = 5;
  const gstCharge = Math.round(itemsSubtotal * 0.18);
  const grandTotal = Math.max(0, itemsSubtotal + deliveryFee + handlingFee + gstCharge - couponDiscount);
  const totalSavings = Math.max(0, totalMRP - itemsSubtotal) + couponDiscount;

  // Finalize order API call
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
      const selectedPickup = addresses.find((entry) => entry.id === pickupAddressId) || addresses[0];
      const selectedDelivery = sameAsPickup
        ? selectedPickup
        : (addresses.find((entry) => entry.id === deliveryAddressId) || selectedPickup);

      const result = await postOrder({
        addressId: selectedPickup.id,
        address: selectedPickup,
        deliveryAddress: selectedDelivery,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: data?.items ?? [],
        pickup: { day: "today", slot: "15-30 mins", express: true },
        payment: method,
        couponCode: appliedCode ?? undefined,
        couponDiscount,
        instructions: getCartState().instructions || "",
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
    if (!pickupAddressId) {
      toast.error("Please select or add a pickup address.");
      return;
    }
    if (!sameAsPickup && !deliveryAddressId) {
      toast.error("Please select or add a delivery address.");
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

    const selectedMethod = payments.find((entry) => entry.id === paymentId) || payments[0];

    // Cash on Delivery
    if (selectedMethod.kind === "cod") {
      await finalizeOrder(selectedMethod);
      return;
    }

    // Wallet Payment
    if (selectedMethod.kind === "wallet" && liveWalletBalance >= grandTotal) {
      await finalizeOrder(selectedMethod);
      return;
    }

    if (selectedMethod.kind === "wallet" && liveWalletBalance < grandTotal) {
      toast.error("Insufficient QuickPress Wallet balance — choose UPI or Cash on Delivery.");
      return;
    }

    // Online Payments (UPI / Cards via Razorpay)
    setPayResult(null);
    const result = await payMutation.mutateAsync({
      amount: grandTotal,
      walletAmount: 0,
      orderId: orderKey,
    });
    setPayResult(result);

    if (result.status === "paid") {
      await finalizeOrder(selectedMethod);
    } else {
      setOrderKey(newOrderKey());
      toast.error(result.message);
    }
  };

  const selectedPickup = addresses.find((a) => a.id === pickupAddressId) || addresses[0];
  const selectedDelivery = sameAsPickup
    ? selectedPickup
    : (addresses.find((a) => a.id === deliveryAddressId) || selectedPickup);

  const PickupIcon = selectedPickup ? ADDRESS_ICONS[selectedPickup.label] || MapPin : MapPin;
  const DeliveryIcon = selectedDelivery ? ADDRESS_ICONS[selectedDelivery.label] || MapPin : MapPin;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      void navigate({ to: "/home" });
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white text-zinc-900 pb-36 font-sans">
      <div className="mx-auto w-full max-w-md bg-white">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={handleBack}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 transition-transform active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="size-5" />
            </button>

            <div className="text-center min-w-0 flex-1">
              <h1 className="text-sm font-black tracking-tight text-zinc-900 truncate">
                Checkout
              </h1>
              <p className="text-[10px] font-extrabold text-[#0c831f] flex items-center justify-center gap-1">
                <Zap className="size-3 fill-[#0c831f] text-[#0c831f] animate-pulse" />
                <span>QuickPress 10-15 Min Doorstep Pickup</span>
              </p>
            </div>

            <span className="size-9 shrink-0" />
          </div>
        </header>

        <div className="px-4 pt-3 space-y-4">
          {/* SECTION 1: Pickup Address (First at Top) */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#0c831f]">
                  <MapPin className="size-4" />
                </span>
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  1. Pickup Address
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/addresses" })}
                className="text-xs font-bold text-[#0c831f] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3.5" /> Add New
              </button>
            </div>

            {/* Selected Pickup Address Card */}
            {selectedPickup ? (
              <div className="rounded-xl border-2 border-[#0c831f] bg-emerald-50/50 p-3.5 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0c831f] text-white shadow-xs">
                  <PickupIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-zinc-900">{selectedPickup.label}</p>
                    <span className="rounded-md bg-[#0c831f] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                      PICKUP LOCATION
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600 leading-snug">
                    {selectedPickup.line}, {selectedPickup.city}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
                    Phone: {selectedPickup.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPickupPicker(!showPickupPicker)}
                  className="text-xs font-black text-[#0c831f] hover:underline cursor-pointer"
                >
                  {showPickupPicker ? "Close" : "Change"}
                </button>
              </div>
            ) : null}

            {/* Pickup Address Selector List */}
            {showPickupPicker ? (
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <p className="text-[11px] font-bold text-zinc-500">Select another pickup address:</p>
                {addresses.map((addr) => {
                  const Icon = ADDRESS_ICONS[addr.label] || MapPin;
                  const isSelected = addr.id === pickupAddressId;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setPickupAddressId(addr.id);
                        setShowPickupPicker(false);
                      }}
                      className={`rounded-xl border p-3 flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected ? "border-[#0c831f] bg-emerald-50/60" : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="size-4 text-zinc-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900">{addr.label}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{addr.line}</p>
                        </div>
                      </div>
                      <span className={`size-4 rounded-full border flex items-center justify-center ${isSelected ? "border-[#0c831f] bg-[#0c831f] text-white" : "border-zinc-300"}`}>
                        {isSelected ? <Check className="size-2.5" /> : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* SAME AS PICKUP ADDRESS TOGGLE BUTTON */}
            <div
              onClick={() => {
                const nextSame = !sameAsPickup;
                setSameAsPickup(nextSame);
                if (nextSame) setDeliveryAddressId(pickupAddressId);
              }}
              className="rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 p-3 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${sameAsPickup ? "border-[#0c831f] bg-[#0c831f] text-white" : "border-zinc-300 bg-white"}`}>
                  {sameAsPickup ? <Check className="size-3.5" /> : null}
                </span>
                <span className="text-xs font-bold text-zinc-800 truncate">
                  Delivery address is same as pickup address
                </span>
              </div>
              {sameAsPickup ? (
                <span className="rounded bg-emerald-100 text-[#0c831f] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  SAME
                </span>
              ) : (
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                  DIFFERENT
                </span>
              )}
            </div>

            {/* SEPARATE DELIVERY ADDRESS CARD (Renders when sameAsPickup is FALSE) */}
            {!sameAsPickup ? (
              <div className="pt-2 border-t border-dashed border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="size-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Separate Delivery Address
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/addresses" })}
                    className="text-xs font-bold text-[#0c831f] hover:underline"
                  >
                    + Add New
                  </button>
                </div>

                {selectedDelivery ? (
                  <div className="rounded-xl border-2 border-blue-600 bg-blue-50/50 p-3.5 flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                      <DeliveryIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-zinc-900">{selectedDelivery.label}</p>
                        <span className="rounded-md bg-blue-600 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                          DELIVERY LOCATION
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 leading-snug">
                        {selectedDelivery.line}, {selectedDelivery.city}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
                        Phone: {selectedDelivery.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeliveryPicker(!showDeliveryPicker)}
                      className="text-xs font-black text-blue-600 hover:underline cursor-pointer"
                    >
                      {showDeliveryPicker ? "Close" : "Change"}
                    </button>
                  </div>
                ) : null}

                {/* Delivery Address Selector List */}
                {showDeliveryPicker ? (
                  <div className="space-y-2 pt-2 border-t border-zinc-100">
                    <p className="text-[11px] font-bold text-zinc-500">Select delivery address:</p>
                    {addresses.map((addr) => {
                      const Icon = ADDRESS_ICONS[addr.label] || MapPin;
                      const isSelected = addr.id === deliveryAddressId;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setDeliveryAddressId(addr.id);
                            setShowDeliveryPicker(false);
                          }}
                          className={`rounded-xl border p-3 flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected ? "border-blue-600 bg-blue-50/60" : "border-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="size-4 text-zinc-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-900">{addr.label}</p>
                              <p className="text-[11px] text-zinc-500 truncate">{addr.line}</p>
                            </div>
                          </div>
                          <span className={`size-4 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300"}`}>
                            {isSelected ? <Check className="size-2.5" /> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* SECTION 2: Contact Details */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#0c831f]">
                <User className="size-4" />
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                2. Contact Details
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-900 focus:border-[#0c831f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c831f]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={14}
                  placeholder="10-digit Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-900 focus:border-[#0c831f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c831f]"
                />
              </div>
            </div>
            <p className="text-[10px] font-semibold text-[#0c831f] flex items-center gap-1">
              <Check className="size-3" /> Auto-saved to profile & digital receipt
            </p>
          </section>

          {/* SECTION 3: Order Items Summary */}
          {data?.items && data.items.length > 0 ? (
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Items Selected ({data.items.length})
                </h2>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/home" })}
                  className="text-xs font-bold text-[#0c831f] hover:underline"
                >
                  Edit Items
                </button>
              </div>

              <div className="space-y-2">
                {data.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 last:border-none">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-emerald-50 text-[#0c831f] font-black text-[10px]">
                        {item.qty}x
                      </span>
                      <span className="font-bold text-zinc-800">{item.name}</span>
                    </div>
                    <span className="font-black text-zinc-900">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* SECTION 4: Promo Codes & Coupons */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#0c831f]">
                  <Tag className="size-4" />
                </span>
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Coupons & Offers
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
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              ) : null}
            </div>

            {appliedCode ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-[#0c831f]" /> Code '{appliedCode}' Applied!
                </span>
                <span className="font-black text-[#0c831f]">-₹{couponDiscount}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon (e.g. QUICK50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#0c831f]"
                />
                <button
                  type="button"
                  disabled={!couponCode.trim() || applying}
                  onClick={() => void onApplyCoupon(couponCode)}
                  className="rounded-xl bg-[#0c831f] hover:bg-emerald-800 disabled:opacity-50 px-4 py-2 text-xs font-black text-white shadow-xs active:scale-95 cursor-pointer"
                >
                  {applying ? "Applying..." : "APPLY"}
                </button>
              </div>
            )}
          </section>

          {/* SECTION 5: Blinkit Payment Methods */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#0c831f]">
                <Smartphone className="size-4" />
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Payment Options
              </h2>
            </div>

            <div className="space-y-2.5">
              {payments.map((method) => {
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
                    className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      active
                        ? "border-2 border-[#0c831f] bg-emerald-50/70 shadow-xs"
                        : "border-zinc-200 bg-white hover:border-emerald-500/40"
                    } ${method.enabled ? "" : "opacity-50 pointer-events-none"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {method.kind === "upi" ? (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#0c831f]">
                          <Smartphone className="size-5" />
                        </div>
                      ) : method.kind === "credit" || method.kind === "debit" ? (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <CreditCard className="size-5" />
                        </div>
                      ) : method.kind === "wallet" ? (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                          <Wallet className="size-5" />
                        </div>
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                          <Banknote className="size-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-black text-zinc-900">{method.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {method.kind === "wallet" ? `QuickPress Wallet Balance: ₹${liveWalletBalance}` : method.note}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        active ? "border-[#0c831f] bg-[#0c831f] text-white" : "border-zinc-300"
                      }`}
                    >
                      {active ? <Check className="size-3" /> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 6: Bill Details Breakdown Card */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 pb-2 border-b border-zinc-100">
              Bill Details
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span>Items Total (MRP)</span>
                <span className="line-through text-zinc-400">₹{totalMRP}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-700 font-medium">
                <span>Discounted Subtotal</span>
                <span className="font-bold text-zinc-900">₹{itemsSubtotal}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-500">
                <span className="flex items-center gap-1">
                  Delivery Charge
                  <span className="rounded-md bg-emerald-100 text-[#0c831f] px-1.5 py-0.2 text-[10px] font-black">
                    FREE
                  </span>
                </span>
                <span className="font-black text-[#0c831f]">FREE</span>
              </div>

              <div className="flex items-center justify-between text-zinc-500">
                <span>Handling Fee</span>
                <span className="text-zinc-800 font-semibold">₹{handlingFee}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-500">
                <span>Taxes & GST (18%)</span>
                <span className="text-zinc-800 font-semibold">₹{gstCharge}</span>
              </div>

              {couponDiscount > 0 ? (
                <div className="flex items-center justify-between text-[#0c831f] font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              ) : null}

              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-sm font-black text-zinc-900">
                <span>To Pay</span>
                <span className="text-base text-[#0c831f]">₹{grandTotal}</span>
              </div>
            </div>

            {/* Total Savings Highlight Box */}
            {totalSavings > 0 ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-black text-[#0c831f] flex items-center justify-center gap-1.5">
                <Sparkles className="size-4" />
                <span>Total Savings on this order: ₹{totalSavings}</span>
              </div>
            ) : null}
          </section>

          {/* SECTION 7: Guarantee Policy */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs flex items-start gap-3">
            <ShieldCheck className="size-5 shrink-0 text-[#0c831f] mt-0.5" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              By placing this order you agree to QuickPress Terms & Conditions and 100% doorstep fabric safety guarantee.
            </p>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-zinc-200 p-3 shadow-2xl">
          <div className="mx-auto w-full max-w-md flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Total Payable
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-zinc-900">₹{grandTotal}</span>
                {totalSavings > 0 ? (
                  <span className="text-[10px] font-extrabold text-[#0c831f]">
                    Saved ₹{totalSavings}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void placeOrder()}
              disabled={placing}
              className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0c831f] hover:bg-emerald-800 text-white font-black text-sm shadow-md transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {placing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : placed ? (
                <Check className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
              <span>{placing ? "Placing Order..." : placed ? "Order Placed!" : `Pay ₹${grandTotal}`}</span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
