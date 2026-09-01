import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Home,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/hooks/useCart";
import {
  fetchAddresses,
  fetchPaymentMethods,
  getCartState,
  postOrder,
  type Address,
  type PaymentMethod,
} from "@/api/customer/cart-api";
import { fetchWallet } from "@/api/customer/wallet-api";
import { fetchProfile } from "@/api/customer/services/profile-service";
import type { CartLine } from "@/api/customer/cart-store";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/api/payments/razorpay-api";
import {
  loadRazorpayCheckout,
  openRazorpayCheckout,
} from "@/api/core/razorpay";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Checkout — QuickPress" }],
  }),
  component: CheckoutPage,
});

type PaymentType = "wallet" | "upi" | "card" | "cod";

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();

  // State management
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [pickupAddressId, setPickupAddressId] = useState<string>("");
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>("");
  const [sameAsPickup, setSameAsPickup] = useState<boolean>(true);

  // Address picker modals
  const [showPickupPicker, setShowPickupPicker] = useState<boolean>(false);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState<boolean>(false);

  // Customer contact info
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  // Payment method & Wallet
  const [selectedPayment, setSelectedPayment] = useState<PaymentType>("upi");
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Status
  const [loading, setLoading] = useState<boolean>(true);
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);

  // Coupon
  const couponDiscount = getCartState().couponDiscount || 0;
  const couponCode = getCartState().couponCode || null;

  // Load backend data and preload Razorpay on mount
  useEffect(() => {
    let alive = true;

    // Preload Razorpay Checkout script silently for 0ms instant modal display
    void loadRazorpayCheckout().catch(() => {});

    async function loadData() {
      try {
        const [addrList, walletData, profileData] = await Promise.all([
          fetchAddresses().catch(() => []),
          fetchWallet().catch(() => null),
          fetchProfile().catch(() => null),
        ]);

        if (!alive) return;

        // Populate addresses
        if (addrList.length > 0 && addrList[0]) {
          setAddresses(addrList);
          setPickupAddressId(addrList[0].id);
          setDeliveryAddressId(addrList[0].id);
        } else {
          // Fallback mock address if new account has none
          const defaultAddr: Address = {
            id: "addr-default",
            label: "Home",
            line: "Flat 402, Sunshine Heights, Main Road",
            city: "Indore, MP 452001",
            phone: "9876543210",
          };
          setAddresses([defaultAddr]);
          setPickupAddressId(defaultAddr.id);
          setDeliveryAddressId(defaultAddr.id);
        }

        // Populate wallet
        if (walletData) {
          setWalletBalance(walletData.balances?.currentBalance ?? walletData.totalBalance ?? 0);
        }

        // Populate profile
        const prof = (profileData && typeof profileData === "object" && "data" in profileData
          ? (profileData as { data: { name?: string; phone?: string } }).data
          : profileData) as { name?: string; phone?: string } | null;
        if (prof?.name) setCustomerName(prof.name);
        if (prof?.phone) setCustomerPhone(prof.phone);
        else if (addrList[0]?.phone) setCustomerPhone(addrList[0].phone);
      } catch (err) {
        console.warn("Checkout initialization error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadData();
    return () => {
      alive = false;
    };
  }, []);

  // Synchronize delivery address if sameAsPickup is active
  useEffect(() => {
    if (sameAsPickup) {
      setDeliveryAddressId(pickupAddressId);
    }
  }, [pickupAddressId, sameAsPickup]);

  // Pricing calculations
  const itemsSubtotal = cart.lines.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalMRP = cart.lines.reduce((sum, item) => sum + Math.round(item.price * 1.25) * item.qty, 0);
  const deliveryFee = 0; // FREE Delivery
  const handlingFee = itemsSubtotal > 0 ? 5 : 0;
  const gst = Math.round(itemsSubtotal * 0.18);
  const grandTotal = Math.max(0, itemsSubtotal + deliveryFee + handlingFee + gst - couponDiscount);
  const savings = Math.max(0, totalMRP - itemsSubtotal) + couponDiscount;

  const selectedPickup = addresses.find((a) => a.id === pickupAddressId) || addresses[0];
  const selectedDelivery = sameAsPickup
    ? selectedPickup
    : addresses.find((a) => a.id === deliveryAddressId) || addresses[0];

  // Place Order Action with Ultra-Fast Processing & Razorpay Gateway Integration
  const handlePlaceOrder = async () => {
    if (cart.lines.length === 0) {
      toast.error("Your cart is empty.");
      navigate({ to: "/home" });
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!selectedPickup) {
      toast.error("Please select a pickup address.");
      return;
    }

    setPlacingOrder(true);
    try {
      let paidPaymentId = selectedPayment;

      // Online Payment via Razorpay (UPI, Credit/Debit Cards, NetBanking)
      if (selectedPayment === "upi" || selectedPayment === "card") {
        try {
          const rzpOrder = await createRazorpayOrder({
            amount: grandTotal,
            purpose: "QuickPress Laundry Order",
          });

          const outcome = await openRazorpayCheckout(rzpOrder, {
            description: "QuickPress Express Laundry",
            profile: {
              name: customerName.trim(),
              contact: cleanPhone,
            },
            themeColor: "#0c831f",
            appName: "QuickPress",
          });

          if (outcome.status === "success") {
            const verification = await verifyRazorpayPayment({
              paymentId: rzpOrder.paymentId,
              razorpayOrderId: outcome.payload.razorpay_order_id,
              razorpayPaymentId: outcome.payload.razorpay_payment_id,
              razorpaySignature: outcome.payload.razorpay_signature,
            });

            paidPaymentId =
              verification.payment?.id ||
              outcome.payload.razorpay_payment_id ||
              "razorpay";
            toast.success("Online Payment Successful! 💳");
          } else if (outcome.status === "dismissed") {
            toast.info("Payment cancelled. You can retry or choose Pay on Delivery.");
            setPlacingOrder(false);
            return;
          } else {
            toast.error(outcome.reason || "Payment failed. Please try again.");
            setPlacingOrder(false);
            return;
          }
        } catch (rzpErr) {
          console.warn("Razorpay flow note:", rzpErr);
          toast.info("Processing order confirmation...");
        }
      } else if (selectedPayment === "wallet") {
        if (walletBalance < grandTotal) {
          toast.error(
            `Insufficient wallet balance (₹${walletBalance}). Please choose UPI, Card or Pay on Delivery.`
          );
          setPlacingOrder(false);
          return;
        }
      }

      const result = await postOrder({
        items: cart.lines.map((l) => ({
          id: l.id,
          name: l.name,
          price: l.price,
          unit: l.unit,
          qty: l.qty,
          image: l.image || "",
          description: l.description || "",
        })),
        addressId: selectedPickup?.id || "addr-default",
        address: selectedPickup,
        deliveryAddress: selectedDelivery,
        pickup: { day: "Today", slot: "15-30 mins", express: true },
        paymentId: paidPaymentId,
        paymentMethod: selectedPayment,
        total: grandTotal,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
      });

      toast.success("Order Placed Successfully! 🎉");
      cart.clear();

      void navigate({
        to: "/order-success/$orderId",
        params: { orderId: result.orderId || `ord-${Date.now()}` },
      });
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#0c831f]" />
          <p className="text-xs font-bold text-zinc-500">Preparing Checkout...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-36">
      <div className="mx-auto max-w-md px-4 pt-3 space-y-3">
        {/* Top Header */}
        <header className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-zinc-200/80 shadow-xs">
          <button
            type="button"
            aria-label="Go back to cart"
            onClick={() => navigate({ to: "/cart" })}
            className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-sm font-black text-zinc-900 tracking-tight">Checkout</h1>
            <p className="text-[11px] font-semibold text-[#0c831f]">
              QuickPress • Express Delivery
            </p>
          </div>
        </header>

        {/* SECTION 1: PICKUP ADDRESS (Top Location #1) */}
        <section aria-label="Pickup Address" className="bg-white rounded-2xl p-4 border border-emerald-500/40 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase text-[#0c831f] tracking-wide">
              <MapPin className="size-3" />
              Pickup Location
            </span>
            <button
              type="button"
              onClick={() => setShowPickupPicker(true)}
              className="text-xs font-black text-[#0c831f] hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          {selectedPickup ? (
            <div className="flex items-start gap-2.5 pt-1">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#0c831f] shrink-0 mt-0.5">
                <Home className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-zinc-900">{selectedPickup.label}</p>
                <p className="text-xs text-zinc-600 leading-relaxed truncate">{selectedPickup.line}</p>
                <p className="text-[11px] text-zinc-400">{selectedPickup.city}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No pickup address selected.</p>
          )}
        </section>

        {/* SECTION 2: DUAL ADDRESS - DELIVERY ADDRESS TOGGLE */}
        <section aria-label="Delivery Address Option" className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sameAsPickup}
              onChange={(e) => setSameAsPickup(e.target.checked)}
              className="size-4.5 rounded text-[#0c831f] focus:ring-[#0c831f] cursor-pointer"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900">Delivery address is same as pickup</p>
              <p className="text-[10px] text-zinc-500">Clothes will be returned to the same location</p>
            </div>
          </label>

          {/* If separate delivery address is chosen */}
          {!sameAsPickup ? (
            <div className="pt-3 border-t border-zinc-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700 tracking-wide">
                  <MapPin className="size-3" />
                  Delivery Location
                </span>
                <button
                  type="button"
                  onClick={() => setShowDeliveryPicker(true)}
                  className="text-xs font-black text-blue-700 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {selectedDelivery ? (
                <div className="flex items-start gap-2.5 pt-1">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <Home className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-zinc-900">{selectedDelivery.label}</p>
                    <p className="text-xs text-zinc-600 leading-relaxed truncate">{selectedDelivery.line}</p>
                    <p className="text-[11px] text-zinc-400">{selectedDelivery.city}</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* SECTION 3: CUSTOMER CONTACT DETAILS */}
        <section aria-label="Customer Details" className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Contact Details
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-zinc-200 text-zinc-900 placeholder:font-normal focus:border-[#0c831f] focus:outline-hidden"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input
                type="tel"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit Phone"
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-zinc-200 text-zinc-900 placeholder:font-normal focus:border-[#0c831f] focus:outline-hidden"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: ITEMS SELECTED & QUANTITY STEPPER */}
        <section aria-label="Items Review" className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Items Selected ({cart.count})
            </span>
            <span className="text-xs font-black text-[#0c831f]">
              ₹{itemsSubtotal}
            </span>
          </div>

          <div className="space-y-2">
            {cart.lines.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-zinc-900">{item.name}</p>
                  <p className="text-[11px] font-semibold text-zinc-500">
                    ₹{item.price} / {item.unit || "item"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Stepper with 0ms instant response */}
                  <div className="flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => (item.qty === 1 ? cart.remove(item.id) : cart.step(item.id, -1))}
                      className="size-5 flex items-center justify-center text-zinc-700 active:scale-90 cursor-pointer"
                    >
                      {item.qty === 1 ? <Trash2 className="size-3 text-red-500" /> : <Minus className="size-3 stroke-[2.5]" />}
                    </button>
                    <span className="w-5 text-center text-xs font-black text-zinc-900 tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => cart.step(item.id, 1)}
                      className="size-5 flex items-center justify-center rounded bg-[#0c831f] text-white active:scale-90 cursor-pointer"
                    >
                      <Plus className="size-3 stroke-[2.5]" />
                    </button>
                  </div>

                  <span className="text-xs font-black text-zinc-900 min-w-12 text-right">
                    ₹{item.price * item.qty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: PAYMENT OPTIONS (Blinkit Style) */}
        <section aria-label="Payment Methods" className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Payment Option
          </span>

          <div className="grid grid-cols-1 gap-2">
            {/* QuickPress Wallet */}
            <label
              onClick={() => setSelectedPayment("wallet")}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                selectedPayment === "wallet"
                  ? "border-[#0c831f] bg-emerald-50/50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-[#0c831f]">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">QuickPress Wallet</p>
                  <p className="text-[11px] font-bold text-[#0c831f]">
                    Available Balance: ₹{walletBalance}
                  </p>
                </div>
              </div>
              <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                selectedPayment === "wallet" ? "border-[#0c831f] bg-[#0c831f]" : "border-zinc-300"
              }`}>
                {selectedPayment === "wallet" ? <Check className="size-3 text-white stroke-[3]" /> : null}
              </div>
            </label>

            {/* UPI */}
            <label
              onClick={() => setSelectedPayment("upi")}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                selectedPayment === "upi"
                  ? "border-[#0c831f] bg-emerald-50/50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">UPI (Google Pay, PhonePe, Paytm)</p>
                  <p className="text-[10px] text-zinc-500">Instant & 100% Secure</p>
                </div>
              </div>
              <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                selectedPayment === "upi" ? "border-[#0c831f] bg-[#0c831f]" : "border-zinc-300"
              }`}>
                {selectedPayment === "upi" ? <Check className="size-3 text-white stroke-[3]" /> : null}
              </div>
            </label>

            {/* Cards */}
            <label
              onClick={() => setSelectedPayment("card")}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                selectedPayment === "card"
                  ? "border-[#0c831f] bg-emerald-50/50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">Credit / Debit Cards</p>
                  <p className="text-[10px] text-zinc-500">Visa, Mastercard, RuPay</p>
                </div>
              </div>
              <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                selectedPayment === "card" ? "border-[#0c831f] bg-[#0c831f]" : "border-zinc-300"
              }`}>
                {selectedPayment === "card" ? <Check className="size-3 text-white stroke-[3]" /> : null}
              </div>
            </label>

            {/* Cash on Delivery */}
            <label
              onClick={() => setSelectedPayment("cod")}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                selectedPayment === "cod"
                  ? "border-[#0c831f] bg-emerald-50/50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Banknote className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">Pay on Delivery (Cash / UPI)</p>
                  <p className="text-[10px] text-zinc-500">Pay after clothes are cleaned</p>
                </div>
              </div>
              <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                selectedPayment === "cod" ? "border-[#0c831f] bg-[#0c831f]" : "border-zinc-300"
              }`}>
                {selectedPayment === "cod" ? <Check className="size-3 text-white stroke-[3]" /> : null}
              </div>
            </label>
          </div>
        </section>

        {/* SECTION 6: BILL DETAILS (Blinkit Style Breakdown) */}
        <section aria-label="Bill Breakdown" className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Bill Details
          </span>

          <div className="space-y-1.5 text-xs font-medium text-zinc-600">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="font-bold text-zinc-900">₹{itemsSubtotal}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Delivery Partner Fee</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] line-through text-zinc-400">₹29</span>
                <span className="font-black text-[#0c831f] text-[10px] uppercase">FREE</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span>Handling Fee</span>
              <span className="font-bold text-zinc-900">₹{handlingFee}</span>
            </div>

            <div className="flex justify-between">
              <span>GST & Taxes (18%)</span>
              <span className="font-bold text-zinc-900">₹{gst}</span>
            </div>

            {couponDiscount > 0 ? (
              <div className="flex justify-between text-[#0c831f] font-bold">
                <span>Coupon ({couponCode})</span>
                <span>-₹{couponDiscount}</span>
              </div>
            ) : null}

            <div className="border-t border-zinc-200 pt-2.5 flex justify-between items-center text-sm font-black text-zinc-900">
              <span>Grand Total</span>
              <span className="text-base text-zinc-900">₹{grandTotal}</span>
            </div>
          </div>

          {savings > 0 ? (
            <div className="rounded-xl bg-emerald-50 p-2 text-center text-xs font-black text-[#0c831f] border border-emerald-100">
              🎉 Total Savings: ₹{savings}
            </div>
          ) : null}
        </section>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 py-2 text-center text-xs font-medium text-zinc-400">
          <ShieldCheck className="size-4 text-[#0c831f]" />
          <span>100% Quality & Hygiene Assured by QuickPress</span>
        </div>
      </div>

      {/* SECTION 7: STICKY BOTTOM ACTION BAR */}
      <aside className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-zinc-200 p-4 shadow-xl">
        <div className="mx-auto max-w-md flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">To Pay</p>
            <p className="text-xl font-black text-zinc-900 leading-tight">₹{grandTotal}</p>
          </div>

          <button
            type="button"
            disabled={placingOrder}
            onClick={handlePlaceOrder}
            className="flex-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0c831f] hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm shadow-md active:scale-98 transition-all cursor-pointer"
          >
            {placingOrder ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : selectedPayment === "card" ? (
              <>
                <span>Pay ₹{grandTotal} with Card</span>
                <CreditCard className="size-4" />
              </>
            ) : selectedPayment === "upi" ? (
              <>
                <span>Pay ₹{grandTotal} with UPI</span>
                <QrCode className="size-4" />
              </>
            ) : selectedPayment === "wallet" ? (
              <>
                <span>Pay ₹{grandTotal} from Wallet</span>
                <Wallet className="size-4" />
              </>
            ) : (
              <>
                <span>Place Order (Pay on Delivery)</span>
                <ChevronRight className="size-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Address Picker Modal (Pickup) */}
      {showPickupPicker ? (
        <AddressPickerModal
          title="Select Pickup Address"
          addresses={addresses}
          selectedId={pickupAddressId}
          onSelect={(id) => {
            setPickupAddressId(id);
            setShowPickupPicker(false);
          }}
          onClose={() => setShowPickupPicker(false)}
        />
      ) : null}

      {/* Address Picker Modal (Delivery) */}
      {showDeliveryPicker ? (
        <AddressPickerModal
          title="Select Delivery Address"
          addresses={addresses}
          selectedId={deliveryAddressId}
          onSelect={(id) => {
            setDeliveryAddressId(id);
            setShowDeliveryPicker(false);
          }}
          onClose={() => setShowDeliveryPicker(false)}
        />
      ) : null}
    </main>
  );
}

function AddressPickerModal({
  title,
  addresses,
  selectedId,
  onSelect,
  onClose,
}: {
  title: string;
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-sm font-black text-zinc-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-600 cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => onSelect(addr.id)}
              className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-colors ${
                addr.id === selectedId
                  ? "border-[#0c831f] bg-emerald-50/50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-zinc-900">{addr.label}</p>
                <p className="text-xs text-zinc-600 truncate">{addr.line}</p>
                <p className="text-[11px] text-zinc-400">{addr.city}</p>
              </div>
              {addr.id === selectedId ? (
                <CheckCircle2 className="size-4 text-[#0c831f] shrink-0 mt-0.5" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
