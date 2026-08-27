import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Clock,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useCart } from "@/hooks/useCart";
import { fetchCart, type CartData } from "@/api/customer/cart-api";
import type { CartLine } from "@/api/customer/cart-store";

interface CartPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPopup({ isOpen, onClose }: CartPopupProps) {
  const navigate = useNavigate();
  const cart = useCart();
  const [data, setData] = useState<CartData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchCart().then((res) => {
        setData(res);
      });
    }
  }, [isOpen, cart.count, cart.total]);

  if (!isOpen || !mounted) return null;

  // Calculate pure items subtotal
  const itemsSubtotal = cart.lines.reduce((sum, item) => sum + item.price * item.qty, 0);

  const content = (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Popup / Bottom Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className="relative z-10 w-full max-w-md max-h-[85vh] overflow-hidden rounded-t-[2rem] bg-card border-t border-border shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ShoppingBag className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">Your Cart</h2>
              <p className="text-[11px] text-muted-foreground">
                {cart.count} {cart.count === 1 ? "service" : "services"} selected
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close cart popup"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform hover:bg-accent active:scale-95"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Partner Info */}
          {data?.store ? (
            <div className="card-soft flex items-center gap-3 border border-border p-3 rounded-2xl">
              {data.store.image ? (
                <img
                  src={data.store.image}
                  alt={data.store.name}
                  width={64}
                  height={64}
                  className="size-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
                  {data.store.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold text-foreground">{data.store.name}</p>
                  <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                    <Star className="size-2.5 fill-current" />
                    {data.store.rating}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 shrink-0" /> Pickup {data.store.pickupEta}
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="size-3 shrink-0" /> Delivery {data.store.deliveryEta}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Cart Items List */}
          {cart.lines.length === 0 ? (
            <div className="py-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ShoppingBag className="size-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-foreground">Your cart is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">Add services from partner store to continue.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cart.lines.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onStep={(delta) => cart.step(item.id, delta)}
                  onRemove={() => cart.remove(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer / Proceed to Checkout */}
        {cart.lines.length > 0 ? (
          <div className="border-t border-border/60 bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">Item Subtotal</p>
                <p className="text-lg font-extrabold text-foreground">₹{itemsSubtotal}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  void navigate({ to: "/checkout" });
                }}
                className="ripple flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-cta transition-all hover:brightness-[1.03] active:scale-[0.98]"
              >
                Proceed to Checkout
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function CartItemRow({
  item,
  onStep,
  onRemove,
}: {
  item: CartLine;
  onStep: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="card-soft flex items-center justify-between gap-3 border border-border p-3 rounded-2xl bg-card">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-foreground">{item.name}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          ₹{item.price} <span className="text-[10px]">/ {item.unit || "item"}</span>
        </p>
        <p className="mt-1 text-xs font-bold text-primary">
          Subtotal: ₹{item.price * item.qty}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Quantity Stepper */}
        <div className="flex h-8 items-center gap-1.5 rounded-xl border border-border bg-muted/70 px-1.5">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={item.qty <= 1}
            onClick={() => onStep(-1)}
            className="flex size-5 items-center justify-center rounded-lg bg-card text-foreground transition-transform active:scale-90 disabled:opacity-40"
          >
            <Minus className="size-3" />
          </button>
          <span className="w-5 text-center text-xs font-bold text-foreground tabular-nums">
            {item.qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onStep(1)}
            className="flex size-5 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform active:scale-90"
          >
            <Plus className="size-3" />
          </button>
        </div>

        {/* Delete item */}
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          onClick={onRemove}
          className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
