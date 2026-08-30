import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useCart } from "@/hooks/useCart";

/**
 * QuickPress Floating Cart Bar — pixel-perfect match to BottomNav:
 * - Same container width (`max-w-md px-4`)
 * - Same height & padding (`p-1.5`)
 * - Same rounded-full glassmorphic pill frame
 * - Eager route preloading for ultra-fast 0ms navigation to `/cart`
 */
export function FloatingCartBar({
  hasBottomNav,
}: {
  hasBottomNav?: boolean;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count, total } = useCart();
  const [mounted, setMounted] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload /cart and /checkout routes in idle time for instant 0ms open
  useEffect(() => {
    if (count > 0) {
      void router.preloadRoute({ to: "/cart" }).catch(() => undefined);
      void router.preloadRoute({ to: "/checkout" }).catch(() => undefined);
    }
  }, [count, router]);

  // Don't show cart bar on cart or checkout pages themselves
  if (!mounted || count === 0 || pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/order-success")) {
    return null;
  }

  // Auto-detect if current page has the bottom navbar docked at bottom-0
  const pagesWithBottomNav = ["/home", "/history", "/membership", "/offers", "/profile", "/wallet", "/help", "/notifications", "/addresses", "/payment-methods", "/invoices"];
  const showAboveNav =
    hasBottomNav !== undefined
      ? hasBottomNav
      : pagesWithBottomNav.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const handleGoToCart = () => {
    setPressed(true);
    window.setTimeout(() => setPressed(false), 200);
    void navigate({ to: "/cart" });
  };

  const bar = (
    <aside
      aria-label="Floating cart summary"
      className={`fixed inset-x-0 ${
        showAboveNav
          ? "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.25rem)]"
          : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1"
      } z-40 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-none`}
    >
      {/* Exact same container width & padding as BottomNav: max-w-md px-4 */}
      <div className="mx-auto w-full max-w-md px-4">
        <div
          role="button"
          tabIndex={0}
          onClick={handleGoToCart}
          onPointerEnter={() => void router.preloadRoute({ to: "/cart" }).catch(() => undefined)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleGoToCart();
            }
          }}
          className={`pointer-events-auto flex items-center justify-between gap-2.5 rounded-full border border-border/40 bg-card/55 dark:bg-zinc-900/65 p-1.5 pl-3.5 pr-1.5 text-foreground shadow-[0_16px_40px_-18px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 cursor-pointer hover:border-primary/50 hover:bg-card/75 ${
            pressed ? "scale-[0.985]" : "active:scale-[0.985]"
          }`}
        >
          {/* Left: Bag Icon with count badge + Subtotal & item details */}
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  · {count} {count === 1 ? "service" : "services"}
                </span>
              </div>
              <p className="text-[10px] font-bold text-primary flex items-center gap-0.5 leading-none">
                Tap to review cart
              </p>
            </div>
          </div>

          {/* Right: "View Cart" Pill Button matching exact primary button height and styling */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleGoToCart();
            }}
            className="ripple shrink-0 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-cta transition-transform hover:brightness-105 active:scale-95 cursor-pointer"
          >
            <span>View Cart</span>
            <ArrowRight className="size-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </aside>
  );

  return createPortal(bar, document.body);
}
