import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Minus,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { refreshCart, type CartLine } from "@/api/customer/cart-store";
import { useCart } from "@/hooks/useCart";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import {
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
  pickupEta: "60 mins",
  deliveryEta: "Tomorrow by 6 PM",
};

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — QuickPress Laundry Pickup & Delivery" },
      {
        name: "description",
        content:
          "Review your QuickPress laundry services, adjust quantities and proceed to checkout.",
      },
      { property: "og:title", content: "Your Cart — QuickPress Laundry Pickup & Delivery" },
      {
        property: "og:description",
        content:
          "Review laundry items and proceed to QuickPress checkout.",
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
        charges: { pickup: 0, delivery: 0, handling: 0, gstRate: 0.18, discount: 0, minOrder: 0, grandTotal: cart.total },
        availableCoupons: [],
      };
    }
    return null;
  });

  // GET /api/cart — partner store & services from backend
  useEffect(() => {
    let alive = true;
    void fetchCart(0).then((next) => {
      if (!alive) return;
      setData(next);
      setCartState({ data: next });
    });
    void refreshCart(0);
    return () => {
      alive = false;
    };
  }, [cart.count, cart.total]);

  // PUT /api/cart/items/{id}
  const step = (id: string, delta: number) => {
    cart.step(id, delta);
  };

  // DELETE /api/cart/items/{id}
  const remove = (id: string) => {
    cart.remove(id);
    toast.success("Item removed from cart");
  };

  // Clear Entire Cart at once
  const handleClearCart = () => {
    cart.clear();
    setData(null);
    setCartState({ data: null, couponDiscount: 0, couponCode: null, instructions: "" });
    toast.success("Cart cleared successfully");
  };

  // Calculate items subtotal
  const itemsSubtotal = cart.lines.reduce((sum, item) => sum + item.price * item.qty, 0);

  const displayStore = data?.store || DEFAULT_STORE;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white dark:bg-zinc-950 scroll-smooth">
      <div className="relative mx-auto w-full max-w-md">
        {/* Top app bar */}
        <header className="sticky top-0 z-30 mx-auto w-full max-w-md">
          <div className="glass-panel flex items-center justify-between gap-2 px-4 py-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate({ to: "/home" })}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
            >
              <ArrowLeft className="size-5" />
            </button>
            <p className="min-w-0 truncate text-center text-sm font-bold tracking-tight text-foreground">
              Your Cart
            </p>
            {cart.count > 0 ? (
              <button
                type="button"
                onClick={handleClearCart}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-3 text-[11px] font-bold text-destructive transition-all hover:bg-destructive/20 active:scale-95 cursor-pointer"
                title="Clean entire cart"
              >
                <Trash2 className="size-3.5" />
                <span>Clean Cart</span>
              </button>
            ) : (
              <span className="size-9 shrink-0" />
            )}
          </div>
        </header>

        {cart.lines.length === 0 && !data ? (
          <CartSkeleton />
        ) : (
          <div className="px-5 pb-36 pt-2">
            {/* Selected store / partner info */}
            {cart.lines.length > 0 ? (
              <section className="mt-2">
                <div className="card-soft animate-pop flex items-center gap-3 border border-border p-3">
                  {displayStore.image ? (
                    <img
                      src={displayStore.image}
                      alt={`${displayStore.name} laundry store`}
                      width={64}
                      height={64}
                      className="size-16 shrink-0 rounded-2xl object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
                      {displayStore.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-sm font-bold text-foreground">
                        {displayStore.name}
                      </p>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                        <Star className="size-2.5 fill-current" />
                        {displayStore.rating}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3 shrink-0" /> Pickup {displayStore.pickupEta}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Truck className="size-3 shrink-0" /> Delivery {displayStore.deliveryEta}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Cart items list */}
            <section className="mt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-foreground">Services</h2>
                  {cart.count > 0 ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
                      {cart.count} {cart.count === 1 ? "item" : "items"}
                    </span>
                  ) : null}
                </div>
                {cart.lines.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-xs font-bold text-destructive hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="size-3" /> Clear All
                  </button>
                ) : null}
              </div>

              {cart.lines.length === 0 ? (
                <div className="card-soft animate-pop mt-4 border border-dashed border-border/80 p-8 text-center bg-card/60 backdrop-blur-sm">
                  <div className="relative mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-xs">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-8"
                    >
                      <path d="M4 8h16l-1.8 11.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L4 8Z" fill="currentColor" fillOpacity="0.15" />
                      <path d="M4 8h16" />
                      <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
                      <path d="M9 12v5" strokeWidth="1.6" />
                      <path d="M12 11v6" strokeWidth="1.6" />
                      <path d="M15 12v5" strokeWidth="1.6" />
                    </svg>
                    <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary/40 animate-ping" />
                  </div>
                  <p className="mt-4 text-base font-black text-foreground">Your cart is empty</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                    Add services from verified laundry partners to schedule your doorstep pickup.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/home" })}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground shadow-cta transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Explore Services & Add</span>
                  </button>
                </div>
              ) : (
                <div className="stagger-children mt-3 space-y-3">
                  {cart.lines.map((item) => (
                    <SwipeableItem key={item.id} item={item} onStep={step} onRemove={remove} />
                  ))}
                </div>
              )}
            </section>

            {/* Add more services */}
            {cart.lines.length > 0 ? (
              <button
                type="button"
                onClick={() => navigate({ to: "/home" })}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/60 bg-primary/5 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary/10 active:scale-[0.985] cursor-pointer"
              >
                <Plus className="size-4" /> Add more services
              </button>
            ) : null}
          </div>
        )}
      </div>


      {/* Sticky bottom bar */}
      {data && cart.lines.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30">
          <div className="mx-auto w-full max-w-md px-4 pb-4">
            <div className="glass-panel animate-sheet-up flex items-center gap-3 rounded-3xl p-3 shadow-soft">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">Item Subtotal</p>
                <p
                  key={itemsSubtotal}
                  className="animate-pop text-lg font-extrabold leading-tight text-foreground"
                >
                  ₹{itemsSubtotal}
                </p>
              </div>
              <button
                type="button"
                disabled={cart.lines.length === 0}
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
        className="card-soft relative touch-pan-y border border-border p-3.5 transition-transform duration-200 bg-card"
      >
        <div className="flex items-start gap-3">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              width={64}
              height={64}
              loading="lazy"
              className="size-14 shrink-0 rounded-2xl object-cover"
              decoding="async"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base">
              {item.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
              ₹{item.price} <span className="font-normal text-muted-foreground">/ {item.unit || "item"}</span>
            </p>
            <p className="mt-1 text-xs font-bold text-primary">
              Subtotal: ₹{item.price * item.qty}
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

        <div className="mt-3 flex items-center justify-end">
          <Stepper qty={item.qty} onStep={(delta) => onStep(item.id, delta)} />
        </div>
      </div>
    </div>
  );
}

function Stepper({ qty, onStep }: { qty: number; onStep: (delta: number) => void }) {
  return (
    <div className="flex h-9 w-28 items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={qty <= 1}
        onClick={() => onStep(-1)}
        className="flex size-6 items-center justify-center rounded-lg bg-card text-foreground shadow-xs transition-all duration-300 active:scale-[0.88] disabled:opacity-40"
      >
        <Minus className="size-3" />
      </button>
      <span key={qty} className="animate-pop text-sm font-bold tabular-nums text-foreground">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onStep(1)}
        className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-all duration-300 active:scale-[0.88]"
      >
        <Plus className="size-3" />
      </button>
    </div>
  );
}
