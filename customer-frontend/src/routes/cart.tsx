import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgePercent,
  Check,
  ChevronRight,
  Clock,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { refreshCart, type CartLine } from "@/api/customer/cart-store";
import { useCart } from "@/hooks/useCart";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import {
  applyCoupon,
  fetchCart,
  getCartState,
  setCartState,
  type CartData,
  type CartStore,
} from "@/api/customer/cart-api";

const DEFAULT_STORE: CartStore = {
  id: "partner-kasganj",
  name: "QuickPress Partner Store",
  image: "",
  rating: 4.9,
  reviews: "1.2k+ reviews",
  pickupEta: "15-30 mins",
  deliveryEta: "Tomorrow by 6 PM",
};

const INSTRUCTION_CHIPS = [
  { id: "no-bell", label: "Don't ring bell", icon: "🔔" },
  { id: "door", label: "Leave at door/gate", icon: "🚪" },
  { id: "call-before", label: "Call before arrival", icon: "📞" },
  { id: "no-call", label: "Avoid calling", icon: "📵" },
];

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — QuickPress Instant Pickup & Delivery" },
      {
        name: "description",
        content:
          "Review items in your QuickPress cart, apply offers, check bill details, and proceed to instant checkout.",
      },
      { property: "og:title", content: "Your Cart — QuickPress Laundry" },
      {
        property: "og:description",
        content:
          "Instant laundry pickup & delivery cart review with Blinkit speed.",
      },
    ],
  }),
  component: CartScreen,
});

function CartScreen() {
  const { isAuthenticated, isLoading } = useAuthGuard();
  const navigate = useNavigate();
  const cart = useCart();
  const [data, setData] = useState<CartData | null>(() => {
    const cached = getCartState().data;
    if (cached) return cached;
    if (cart.lines.length > 0) {
      return {
        store: DEFAULT_STORE,
        items: cart.lines as any,
        charges: { pickup: 0, delivery: cart.totals.delivery, handling: cart.totals.handling, gstRate: 0.18, discount: 0 },
        totals: cart.totals,
        coupons: [
          { id: "c1", code: "QUICK50", title: "Flat ₹50 OFF", description: "Save ₹50 on orders above ₹299", discount: 50, best: true },
          { id: "c2", code: "FIRST100", title: "₹100 First Order Cashback", description: "Get ₹100 in QuickPress wallet", discount: 100 },
        ],
      };
    }
    return null;
  });

  // Instruction state & Coupons
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState(getCartState().instructions || "");
  const [couponInput, setCouponInput] = useState(getCartState().couponCode || "");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(getCartState().couponCode);
  const [couponDiscount, setCouponDiscount] = useState<number>(getCartState().couponDiscount || 0);
  const [isApplying, setIsApplying] = useState(false);

  // Sync real cart state from backend endpoint asynchronously
  useEffect(() => {
    let alive = true;
    void fetchCart(couponDiscount).then((next) => {
      if (!alive) return;
      setData(next);
      setCartState({ data: next });
    });
    void refreshCart(couponDiscount);
    return () => {
      alive = false;
    };
  }, [cart.count, cart.total, couponDiscount]);

  // Handle instruction chips
  const toggleChip = (label: string) => {
    let updated: string[];
    if (selectedChips.includes(label)) {
      updated = selectedChips.filter((c) => c !== label);
    } else {
      updated = [...selectedChips, label];
    }
    setSelectedChips(updated);
    const combined = [...updated, customNote].filter(Boolean).join(" • ");
    setCartState({ instructions: combined });
  };

  const handleCustomNote = (text: string) => {
    setCustomNote(text);
    const combined = [...selectedChips, text].filter(Boolean).join(" • ");
    setCartState({ instructions: combined });
  };

  // Apply Coupon code
  const handleApplyCoupon = async (code: string) => {
    if (!code.trim()) return;
    setIsApplying(true);
    try {
      const res = await applyCoupon(code);
      if (res.ok) {
        const discountVal = res.discount || 50;
        setAppliedCoupon(code);
        setCouponDiscount(discountVal);
        setCartState({ couponCode: code, couponDiscount: discountVal });
        toast.success(`Coupon '${code}' applied! Saved ₹${discountVal}`);
      } else {
        toast.error("Invalid or expired coupon code");
      }
    } catch {
      // Fallback local coupon application for instant UX
      const match = data?.coupons?.find((c) => c.code.toUpperCase() === code.toUpperCase());
      const disc = match?.discount ?? (code.toUpperCase().includes("50") ? 50 : 30);
      setAppliedCoupon(code.toUpperCase());
      setCouponDiscount(disc);
      setCartState({ couponCode: code.toUpperCase(), couponDiscount: disc });
      toast.success(`Coupon '${code.toUpperCase()}' applied! Saved ₹${disc}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput("");
    setCartState({ couponCode: null, couponDiscount: 0 });
    toast.info("Coupon removed");
  };

  const step = (id: string, delta: number) => {
    cart.step(id, delta);
  };

  const remove = (id: string) => {
    cart.remove(id);
    toast.success("Item removed from cart");
  };

  const handleClearCart = () => {
    cart.clear();
    setData(null);
    setCartState({ data: null, couponDiscount: 0, couponCode: null, instructions: "" });
    toast.success("Cart cleared");
  };

  // Authoritative & local computed pricing
  const itemsSubtotal = cart.lines.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalMRP = cart.lines.reduce((sum, item) => sum + Math.round(item.price * 1.25) * item.qty, 0);
  const mrpSavings = Math.max(0, totalMRP - itemsSubtotal);

  const deliveryFee = itemsSubtotal > 299 || itemsSubtotal === 0 ? 0 : 29;
  const handlingFee = itemsSubtotal > 0 ? 5 : 0;
  const gstCharge = Math.round(itemsSubtotal * 0.18);
  const grandTotal = Math.max(0, itemsSubtotal + deliveryFee + handlingFee + gstCharge - couponDiscount);
  const totalSavings = mrpSavings + (itemsSubtotal > 299 ? 29 : 0) + couponDiscount;

  const displayStore = data?.store || DEFAULT_STORE;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 text-foreground pb-36">
      <div className="mx-auto w-full max-w-md">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 mx-auto w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-border/60">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate({ to: "/home" })}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-transform active:scale-95"
            >
              <ArrowLeft className="size-4.5" />
            </button>

            <div className="text-center min-w-0 flex-1">
              <h1 className="text-sm font-black tracking-tight text-foreground truncate">
                Checkout & Review
              </h1>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Zap className="size-3 fill-emerald-500 text-emerald-500 animate-pulse" />
                <span>Blinkit Speed Delivery • {displayStore.pickupEta}</span>
              </p>
            </div>

            {cart.count > 0 ? (
              <button
                type="button"
                onClick={handleClearCart}
                className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 text-[11px] font-bold text-destructive transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="size-3" />
                <span>Clear</span>
              </button>
            ) : (
              <span className="size-9 shrink-0" />
            )}
          </div>
        </header>

        {cart.lines.length === 0 ? (
          <div className="px-5 pt-12 text-center">
            <div className="relative mx-auto flex size-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-10" />
            </div>
            <h2 className="mt-5 text-lg font-black text-foreground">Your cart is empty</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Add dry cleaning, wash & fold, or iron services from verified laundry partners.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/home" })}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-xs font-black text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="size-4" />
              <span>Explore Laundry Services</span>
            </button>
          </div>
        ) : (
          <div className="px-4 pt-3 space-y-4">
            {/* Blinkit Savings Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 p-3.5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
                    <BadgePercent className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-wide">
                      {totalSavings > 0 ? `🎉 You are saving ₹${totalSavings} on this order!` : "⚡ Lightning Fast Doorstep Pickup"}
                    </p>
                    <p className="text-[10px] text-white/90 font-medium mt-0.5">
                      {itemsSubtotal > 299 ? "FREE Delivery & Pickup Unlocked" : `Add ₹${300 - itemsSubtotal} more for FREE Delivery`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Store Info */}
            <div className="rounded-2xl border border-border bg-card p-3 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-black text-base">
                  {displayStore.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-bold text-foreground">{displayStore.name}</p>
                    <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-400">
                      <Star className="size-2.5 fill-current" />
                      {displayStore.rating}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="size-3 text-emerald-500" /> {displayStore.pickupEta}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Truck className="size-3 text-blue-500" /> {displayStore.deliveryEta}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Items ({cart.count})
                </h2>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/home" })}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3.5" /> Add Items
                </button>
              </div>

              <div className="space-y-2.5">
                {cart.lines.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-card p-3 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="size-12 shrink-0 rounded-xl object-cover border border-border/50"
                        />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-foreground">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-foreground">₹{item.price}</span>
                          <span className="text-[10px] text-muted-foreground line-through">
                            ₹{Math.round(item.price * 1.25)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            / {item.unit || "item"}
                          </span>
                        </div>
                        <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Item Total: ₹{item.price * item.qty}
                        </p>
                      </div>
                    </div>

                    {/* Stepper Control */}
                    <div className="flex h-8 items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-500/10 px-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => step(item.id, -1)}
                        className="flex size-6 items-center justify-center rounded-lg bg-card text-foreground shadow-xs active:scale-90 cursor-pointer"
                      >
                        {item.qty === 1 ? <Trash2 className="size-3 text-destructive" /> : <Minus className="size-3" />}
                      </button>
                      <span className="w-5 text-center text-xs font-black tabular-nums text-foreground">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => step(item.id, 1)}
                        className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs active:scale-90 cursor-pointer"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Coupons & Promo Codes Section */}
            <section className="rounded-2xl border border-border bg-card p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Coupons & Offers
                  </h3>
                </div>
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Check className="size-4 text-emerald-600" /> Code '{appliedCoupon}' Applied!
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">-₹{couponDiscount}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. QUICK50)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={!couponInput.trim() || isApplying}
                      onClick={() => handleApplyCoupon(couponInput)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2 text-xs font-black text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      {isApplying ? "Applying..." : "APPLY"}
                    </button>
                  </div>

                  {/* Available Coupon Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                    {data?.coupons?.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCouponInput(c.code);
                          void handleApplyCoupon(c.code);
                        }}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 cursor-pointer"
                      >
                        <Tag className="size-3" />
                        <span>{c.code} (Save ₹{c.discount})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Delivery Instructions Section */}
            <section className="rounded-2xl border border-border bg-card p-3.5 shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Delivery Instructions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {INSTRUCTION_CHIPS.map((chip) => {
                  const active = selectedChips.includes(chip.label);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleChip(chip.label)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? "border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="text-base">{chip.icon}</span>
                      <span className="leading-tight">{chip.label}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Custom instruction note for delivery agent..."
                value={customNote}
                onChange={(e) => handleCustomNote(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </section>

            {/* Blinkit Bill Details Card */}
            <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground pb-1 border-b border-border/50">
                Bill Details
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Items Total (MRP)</span>
                  <span className="line-through">₹{totalMRP}</span>
                </div>

                <div className="flex items-center justify-between text-foreground font-medium">
                  <span>Discounted Items Subtotal</span>
                  <span className="font-bold">₹{itemsSubtotal}</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Delivery Partner Fee
                    {itemsSubtotal > 299 ? (
                      <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        FREE
                      </span>
                    ) : null}
                  </span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Handling & Platform Fee</span>
                  <span>₹{handlingFee}</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Taxes & GST (18%)</span>
                  <span>₹{gstCharge}</span>
                </div>

                {couponDiscount > 0 ? (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                ) : null}

                <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-black text-foreground">
                  <span>To Pay</span>
                  <span className="text-base text-emerald-600 dark:text-emerald-400">₹{grandTotal}</span>
                </div>
              </div>

              {/* Total Savings Highlight Box */}
              {totalSavings > 0 ? (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="size-4" />
                  <span>Total Savings on this order: ₹{totalSavings}</span>
                </div>
              ) : null}
            </section>

            {/* Cancellation & Service Guarantee Card */}
            <section className="rounded-2xl border border-border bg-card p-3.5 shadow-xs flex items-start gap-3">
              <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="text-[11px] text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">Cancellation & Quality Policy</p>
                <p>
                  Orders cannot be cancelled once driver partner is assigned to ensure zero delay. 100% money-back guarantee for damage or fabric issues.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Sticky Bottom Action Bar (Blinkit Style) */}
        {cart.lines.length > 0 ? (
          <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-zinc-900/95 border-t border-border/80 p-3 shadow-2xl backdrop-blur-md">
            <div className="mx-auto w-full max-w-md flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Grand Total
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-foreground">₹{grandTotal}</span>
                  {totalSavings > 0 ? (
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      Saved ₹{totalSavings}
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate({ to: "/checkout" })}
                className="flex-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <span>Proceed to Pay</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
