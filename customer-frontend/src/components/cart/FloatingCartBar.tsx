import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useCart } from "@/hooks/useCart";
import { CartPopup } from "./CartPopup";

/**
 * Blinkit-style Floating Cart Bar — persistent compact popup docked above the Bottom Navbar
 * whenever the customer has items in the cart (count > 0).
 *
 * Designed with a compact, centered Pure White pill, bold typography, and one-tap checkout.
 */
export function FloatingCartBar({
  offsetClass = "bottom-[4.5rem]",
}: {
  offsetClass?: string;
}) {
  const navigate = useNavigate();
  const { count, total } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || count === 0) return null;

  const bar = (
    <>
      <aside
        aria-label="Floating cart summary"
        className={`fixed inset-x-0 ${offsetClass} z-40 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-none`}
      >
        {/* Compact container with side padding */}
        <div className="mx-auto w-full max-w-[21.5rem] sm:max-w-xs px-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsCartOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsCartOpen(true);
              }
            }}
            className="pointer-events-auto flex items-center justify-between gap-2.5 rounded-full bg-white dark:bg-zinc-900 p-2 pl-3 pr-2 text-foreground shadow-[0_10px_35px_-6px_rgba(0,0,0,0.18)] border border-zinc-200/90 dark:border-zinc-800 transition-all duration-300 active:scale-[0.985] cursor-pointer hover:border-primary/50"
          >
            {/* Left: Bag Icon & Item summary */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex size-8.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <ShoppingBag className="size-4.5" />
                <span className="animate-pop absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-zinc-900">
                  {count}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-zinc-950 dark:text-white">₹{total}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    · {count} {count === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-[10.5px] font-bold text-primary flex items-center gap-0.5">
                  View cart <ChevronRight className="size-3" />
                </p>
              </div>
            </div>

            {/* Right: Direct Checkout Button */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void navigate({ to: "/checkout" });
              }}
              className="ripple shrink-0 flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-xs font-black text-primary-foreground shadow-cta transition-transform hover:brightness-105 active:scale-95"
            >
              Checkout
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Cart bottom sheet modal */}
      <CartPopup isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );

  return createPortal(bar, document.body);
}
