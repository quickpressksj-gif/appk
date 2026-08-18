import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useCart } from "@/hooks/useCart";

/**
 * Floating checkout bar — sirf tab dikhta hai jab cart me naya item add hota
 * hai (peek), phir apne aap chhup jaata hai. Position hamesha bottom navbar
 * ke upar rehti hai.
 */
export function FloatingCartBar({
  offsetClass = "bottom-[5.75rem]",
  autoHideMs = 4000,
}: {
  offsetClass?: string;
  autoHideMs?: number;
}) {
  const { count, total } = useCart();
  const prevCount = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const prev = prevCount.current;
    prevCount.current = count;
    if (prev === null) return; // pehla load — chup raho
    if (count > prev) setVisible(true);
    if (count === 0) setVisible(false);
  }, [count]);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => setVisible(false), autoHideMs);
    return () => window.clearTimeout(t);
  }, [visible, count, autoHideMs]);

  if (!visible || count === 0) return null;

  const bar = (
    <div className={`fixed inset-x-0 ${offsetClass} z-40 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <div className="mx-auto w-full max-w-md px-4">
        <Link
          to="/cart"
          className="glass-panel fab-motion ripple tap-target flex items-center gap-3 rounded-3xl p-3 shadow-soft transition-transform duration-300 active:scale-[0.98]"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-cta">
            <ShoppingBag className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold leading-tight text-foreground">
              {count} {count === 1 ? "item" : "items"} · ₹{total}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Extra charges calculated at checkout
            </span>
          </span>
          <span className="ml-auto flex items-center gap-1 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-cta">
            Checkout <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );

  return mounted ? createPortal(bar, document.body) : bar;
}
