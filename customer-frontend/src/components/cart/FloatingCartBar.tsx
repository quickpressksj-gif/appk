import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useCart } from "@/hooks/useCart";
import { CartPopup } from "./CartPopup";

/**
 * QuickPress Floating Cart Bar — pixel-perfect matching the BottomNav size, pill
 * structure and glassmorphism styling, positioned cleanly above the Navbar with zero overlap.
 */
export function FloatingCartBar({
  hasBottomNav,
}: {
  hasBottomNav?: boolean;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count, total } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || count === 0) return null;

  // Auto-detect if current page has the bottom navbar docked at bottom-0
  const pagesWithBottomNav = ["/home", "/history", "/membership", "/offers", "/profile"];
  const showAboveNav =
    hasBottomNav !== undefined
      ? hasBottomNav
      : pagesWithBottomNav.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const bar = (
    <>
      <aside
        aria-label="Floating cart summary"
        className={`fixed inset-x-0 ${
          showAboveNav
            ? "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.25rem)]"
            : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1"
        } z-40 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-none`}
      >
        {/* Same container width & padding as BottomNav: max-w-md px-4 */}
        <div className="mx-auto w-full max-w-md px-4">
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
            className="pointer-events-auto flex items-center justify-between gap-3 rounded-full border border-border/60 bg-card/85 dark:bg-zinc-900/85 p-1.5 pl-3.5 pr-1.5 text-foreground shadow-[0_16px_40px_-18px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 active:scale-[0.985] cursor-pointer hover:border-primary/50"
          >
            {/* Left: Bag Icon with badge + Subtotal & Items count */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                <ShoppingBag className="size-4.5" />
                <span className="animate-pop absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-black text-white ring-2 ring-card">
                  {count}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-foreground">₹{total}</span>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    · {count} {count === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                  View details <ChevronRight className="size-3" />
                </p>
              </div>
            </div>

            {/* Right: Checkout Button matching primary pill styling */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void navigate({ to: "/checkout" });
              }}
              className="ripple shrink-0 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-cta transition-transform hover:brightness-105 active:scale-95"
            >
              <span>Checkout</span>
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
