import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgePercent,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquareText,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { refreshCart, type CartLine } from "@/api/customer/cart-store";

import { useCart } from "@/hooks/useCart";

import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { Textarea } from "@/shared/ui/textarea";
import {
  applyCoupon,
  fetchCart,
  fetchInstructionChips,
  getCartState,
  setCartState,
  EMPTY_TOTALS,
  type CartData,
} from "@/api/customer/cart-api";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — QuickPress Laundry Pickup & Delivery" },
      {
        name: "description",
        content:
          "Review your QuickPress laundry order, adjust quantities, apply coupons and add special instructions before checkout.",
      },
      { property: "og:title", content: "Your Cart — QuickPress Laundry Pickup & Delivery" },
      {
        property: "og:description",
        content:
          "Review laundry items, apply coupons and add care instructions before QuickPress checkout.",
      },
    ],
  }),
  component: CartScreen,
});

function CartScreen() {
  const navigate = useNavigate();
  const cart = useCart();
  const [data, setData] = useState<CartData | null>(getCartState().data);
  const [chips, setChips] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState(getCartState().couponCode ?? "");
  const [appliedCode, setAppliedCode] = useState<string | null>(getCartState().couponCode);
  const [couponDiscount, setCouponDiscount] = useState(getCartState().couponDiscount);
  const [applying, setApplying] = useState(false);
  const [instructions, setInstructions] = useState(getCartState().instructions);

  // GET /api/cart/instructions
  useEffect(() => {
    let alive = true;
    void fetchInstructionChips().then((next) => {
      if (alive) setChips(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  // GET /api/cart/summary — store, coupons and charges straight from the backend.
  useEffect(() => {
    if (data) return;
    let alive = true;
    void fetchCart(couponDiscount).then((next) => {
      if (!alive) return;
      setData(next);
      setCartState({ data: next });
    });
    return () => {
      alive = false;
    };
  }, [couponDiscount, data]);

  // PUT /api/cart/items/{id} — optimistic, rolled back by the store on failure.
  const step = (id: string, delta: number) => {
    cart.step(id, delta);
  };

  // DELETE /api/cart/items/{id}
  const remove = (id: string) => {
    cart.remove(id);
  };

  // POST /api/coupon/apply
  const onApplyCoupon = async (code: string) => {
    if (!data || !code.trim()) return;
    setApplying(true);
    setCouponCode(code);
    await applyCoupon(code);
    const match = data.coupons.find(
      (coupon) => coupon.code.toLowerCase() === code.trim().toLowerCase(),
    );
    const discount = match?.discount ?? 0;
    setAppliedCode(match ? match.code : null);
    setCouponDiscount(discount);
    setCartState({ couponCode: match ? match.code : null, couponDiscount: discount });
    await refreshCart(discount);
    setApplying(false);
  };

  // Totals are computed by the backend and delivered with every cart response.
  const totals = cart.totals ?? EMPTY_TOTALS;

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
              onClick={() =>
                navigate({ to: "/services/$serviceId", params: { serviceId: "wash-fold" } })
              }
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
            >
              <ArrowLeft className="size-5" />
            </button>
            <p className="min-w-0 flex-1 truncate text-center text-sm font-bold tracking-tight text-foreground">
              Cart
            </p>
            <span className="flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-primary/15 px-3 text-[11px] font-bold text-brand-dark">
              <ShoppingBag className="size-3.5" />
              {totals.count} {totals.count === 1 ? "item" : "items"}
            </span>
          </div>
        </header>

        {!data ? (
          <>
            <CartSkeleton />
          </>
        ) : (
          <div className="px-5 pb-44 pt-2">
            {/* Selected store — GET /api/cart */}
            <section className="mt-2">
              <div className="card-soft animate-pop flex items-center gap-3 border border-border p-3">
                <img
                  src={data.store.image}
                  alt={`${data.store.name} laundry store`}
                  width={640}
                  height={640}
                  className="size-16 shrink-0 rounded-2xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 truncate text-sm font-bold text-foreground">
                      {data.store.name}
                    </p>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                      <Star className="size-2.5 fill-current" />
                      {data.store.rating}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3 shrink-0" /> Pickup {data.store.pickupEta}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Truck className="size-3 shrink-0" /> Delivery {data.store.deliveryEta}
                  </p>
                </div>
              </div>
            </section>

            {/* Cart items */}
            <section className="mt-8">
              <SectionHeading title="Cart items" />
              {cart.lines.length === 0 ? (
                <div className="card-soft animate-pop mt-4 border border-dashed border-border p-8 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                    <ShoppingBag className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-foreground">Your cart is empty</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a service to get your laundry picked up today.
                  </p>
                </div>
              ) : (
                <div className="stagger-children mt-4 space-y-3">
                  {cart.lines.map((item) => (
                    <SwipeableItem key={item.id} item={item} onStep={step} onRemove={remove} />
                  ))}
                </div>
              )}
              <p className="mt-2.5 text-center text-[10px] text-muted-foreground">
                Swipe an item left to delete
              </p>
            </section>

            {/* Add more services */}
            <button
              type="button"
              onClick={() => navigate({ to: "/home" })}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/60 bg-primary/5 text-sm font-bold text-brand-dark transition-all duration-300 hover:bg-primary/10 active:scale-[0.985]"
            >
              <Plus className="size-4" /> Add more services
            </button>

            {/* Coupons — GET /api/coupons, POST /api/coupon/apply */}
            <section className="mt-8">
              <SectionHeading title="Apply coupon" />
              <div className="card-soft mt-4 border border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-muted/60 px-3">
                    <Tag className="size-4 shrink-0 text-muted-foreground" />
                    <input
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                      placeholder="Promo code"
                      aria-label="Promo code"
                      className="w-full min-w-0 bg-transparent text-sm font-semibold tracking-wide text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={applying || !couponCode.trim()}
                    onClick={() => void onApplyCoupon(couponCode)}
                    className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.95] disabled:opacity-50"
                  >
                    {applying ? <Loader2 className="size-4 animate-spin" /> : null}
                    Apply
                  </button>
                </div>

                {appliedCode ? (
                  <p className="animate-pop mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-green">
                    <Check className="size-3.5" /> {appliedCode} applied · ₹{couponDiscount} off
                  </p>
                ) : null}

                <div className="mt-4 space-y-2.5 border-t border-dashed border-border pt-4">
                  {data.coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-brand-dark">
                        <BadgePercent className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-foreground">
                            {coupon.title}
                          </p>
                          {coupon.best ? (
                            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand-green px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-background">
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
                        className="shrink-0 rounded-full border border-primary px-3 py-1.5 text-[11px] font-bold text-brand-dark transition-all duration-300 hover:bg-primary/15 active:scale-[0.94]"
                      >
                        {appliedCode === coupon.code ? "Applied" : "Apply"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Special instructions */}
            <section className="mt-8">
              <SectionHeading title="Special instructions" />
              <div className="stagger-children mt-3 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      const next = instructions ? `${instructions}, ${chip}` : chip;
                      setInstructions(next);
                      setCartState({ instructions: next });
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[11px] font-semibold text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.94]"
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
                placeholder="Add care notes for the QuickPress team…"
                aria-label="Special instructions"
                className="card-soft mt-3 min-h-28 resize-none border border-border px-4 py-3 text-sm shadow-soft focus-visible:border-primary"
              />
            </section>

            {/* Price summary */}
            <section className="mt-8">
              <SectionHeading title="Price summary" />
              <div className="card-soft mt-4 border border-border p-4">
                <SummaryRow label="Items total" value={totals.itemsTotal} />
                <SummaryRow label="Pickup charge" value={totals.pickup} />
                <SummaryRow label="Delivery charge" value={totals.delivery} />
                <SummaryRow label="Handling fee" value={totals.handling} />
                <SummaryRow label="GST (5%)" value={totals.gst} />
                <SummaryRow label="Discount" value={-totals.discount} tone="green" />
                <SummaryRow label="Coupon discount" value={-totals.couponDiscount} tone="green" />
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
            </section>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {data ? (
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
                <p className="text-[11px] text-muted-foreground">
                  {totals.count} {totals.count === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                type="button"
                disabled={totals.count === 0}
                onClick={() => navigate({ to: "/checkout" })}
                className="ml-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-3xl bg-primary text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.97] disabled:opacity-50"
              >
                Proceed to Checkout
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SwipeableItem({
  item,
  onStep,
  onRemove,
}: {
  item: CartLine;
  onStep: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [removing, setRemoving] = useState(false);
  const startX = useRef<number | null>(null);

  const commitRemove = () => {
    setRemoving(true);
    window.setTimeout(() => onRemove(item.id), 220);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl transition-all duration-200 ${
        removing ? "scale-[0.97] opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center rounded-3xl bg-destructive text-destructive-foreground">
        <Trash2 className="size-5" />
      </div>

      <div
        onPointerDown={(event) => {
          startX.current = event.clientX;
        }}
        onPointerMove={(event) => {
          if (startX.current === null) return;
          const delta = event.clientX - startX.current;
          setOffset(Math.min(0, Math.max(-120, delta)));
        }}
        onPointerUp={() => {
          startX.current = null;
          if (offset < -80) {
            setOffset(-120);
            commitRemove();
          } else {
            setOffset(0);
          }
        }}
        onPointerCancel={() => {
          startX.current = null;
          setOffset(0);
        }}
        style={{ transform: `translateX(${offset}px)` }}
        className="card-soft relative touch-pan-y border border-border p-3 transition-transform duration-200"
      >
        <div className="flex items-start gap-3">
          <img
            src={item.image}
            alt={item.name}
            width={640}
            height={640}
            loading="lazy"
            className="size-16 shrink-0 rounded-2xl object-cover"
            decoding="async"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            <p className="mt-1 text-xs font-bold text-foreground">
              ₹{item.price} <span className="font-normal text-muted-foreground">{item.unit}</span>
            </p>
          </div>
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={commitRemove}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive active:scale-[0.9]"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="w-32">
            <Stepper qty={item.qty} onStep={(delta) => onStep(item.id, delta)} />
          </div>
          <span
            key={item.qty}
            className="animate-pop text-sm font-bold tabular-nums text-foreground"
          >
            ₹{item.price * item.qty}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>;
}

function Stepper({ qty, onStep }: { qty: number; onStep: (delta: number) => void }) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-2 py-1.5 transition-all duration-300 ${
        qty > 0 ? "border-primary bg-primary/10" : "border-border bg-muted/60"
      }`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={qty <= 1}
        onClick={() => onStep(-1)}
        className="flex size-7 items-center justify-center rounded-xl bg-card text-foreground shadow-soft transition-all duration-300 active:scale-[0.88] disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span key={qty} className="animate-pop text-sm font-bold tabular-nums text-foreground">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onStep(1)}
        className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.88]"
      >
        <Plus className="size-3.5" />
      </button>
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
