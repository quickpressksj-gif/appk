import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useCart } from "@/hooks/useCart";
import type { CartLine } from "@/api/customer/cart-store";

interface CartPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPopup({ isOpen, onClose }: CartPopupProps) {
  const navigate = useNavigate();
  const cart = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

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
        className="relative z-10 w-full max-w-md max-h-[85vh] overflow-hidden rounded-t-[1.75rem] bg-white border-t border-zinc-200 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 text-zinc-900 font-sans"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#0c831f]">
              <ShoppingBag className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-zinc-900">Your Cart</h2>
              <p className="text-[10px] font-bold text-[#0c831f] flex items-center gap-1">
                <Zap className="size-3 fill-[#0c831f] text-[#0c831f]" />
                <span>{cart.count} {cart.count === 1 ? "item" : "items"} added</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close cart popup"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 active:scale-95 transition-transform cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3">
          {cart.lines.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                <ShoppingBag className="size-5" />
              </span>
              <p className="mt-3 text-sm font-black text-zinc-900">Your cart is empty</p>
              <p className="mt-1 text-xs text-zinc-500">Add services from partner store to continue.</p>
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
          <div className="border-t border-zinc-200 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total</p>
                <p className="text-xl font-black text-zinc-900">₹{cart.totals.grandTotal || itemsSubtotal}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  void navigate({ to: "/checkout" });
                }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0c831f] hover:bg-emerald-800 px-5 text-sm font-black text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Proceed to Checkout</span>
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
    <div className="flex items-center justify-between gap-3 border border-zinc-200 p-3 rounded-xl bg-white shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="size-10 rounded-lg object-cover border border-zinc-100 shrink-0"
          />
        ) : (
          <div className="size-10 rounded-lg bg-emerald-50 text-[#0c831f] font-black text-xs flex items-center justify-center shrink-0">
            {item.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-zinc-900">{item.name}</p>
          <p className="text-[11px] font-medium text-zinc-500">
            ₹{item.price} / {item.unit || "item"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Quantity Stepper */}
        <div className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-1.5">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => (item.qty === 1 ? onRemove() : onStep(-1))}
            className="flex size-6 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-200 transition-transform active:scale-90 cursor-pointer"
          >
            {item.qty === 1 ? <Trash2 className="size-3 text-red-500" /> : <Minus className="size-3" />}
          </button>
          <span className="w-5 text-center text-xs font-black text-zinc-900 tabular-nums">
            {item.qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onStep(1)}
            className="flex size-6 items-center justify-center rounded-md bg-[#0c831f] text-white transition-transform active:scale-90 cursor-pointer"
          >
            <Plus className="size-3" />
          </button>
        </div>

        <span className="text-xs font-black text-zinc-900 min-w-12 text-right">
          ₹{item.price * item.qty}
        </span>
      </div>
    </div>
  );
}
