import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useCart } from "@/hooks/useCart";

/**
 * Animated Laundry Cart / Basket Icon with floating bubbles & pulse micro-animation.
 */
function AnimatedCartIcon({ count }: { count: number }) {
  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-sm animate-pulse" />

      {/* Cart background container */}
      <div className="relative flex size-9.5 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/80 text-white shadow-md transition-transform duration-300 group-hover:scale-105">
        {/* Laundry Cart Vector with animated wash waves */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 text-primary-foreground drop-shadow-sm transition-transform duration-500 hover:rotate-3"
        >
          {/* Laundry Basket Body */}
          <path d="M4 8h16l-1.8 11.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L4 8Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M4 8h16" />
          <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
          {/* Basket Weave / Laundry Lines */}
          <path d="M9 12v5" strokeWidth="1.8" />
          <path d="M12 11v6" strokeWidth="1.8" />
          <path d="M15 12v5" strokeWidth="1.8" />
        </svg>

        {/* Floating Bubble 1 */}
        <span className="absolute -top-0.5 right-1 size-1.5 rounded-full bg-white/90 animate-ping opacity-75" />
        {/* Floating Bubble 2 */}
        <span className="absolute top-1 -left-0.5 size-1 rounded-full bg-white/80 animate-pulse" />
      </div>

      {/* Floating Dynamic Item Count Pill */}
      <span className="animate-pop absolute -top-1 -right-1 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-card animate-bounce duration-1000">
        {count}
      </span>
    </div>
  );
}

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
  const pagesWithBottomNav = [
    "/home",
    "/history",
    "/membership",
    "/offers",
    "/profile",
    "/wallet",
    "/help",
    "/notifications",
    "/addresses",
    "/payment-methods",
    "/invoices",
  ];
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
          className={`group pointer-events-auto flex items-center justify-between gap-2.5 rounded-full border border-primary/25 bg-card/85 dark:bg-zinc-900/85 p-1.5 pl-3 pr-1.5 text-foreground shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 cursor-pointer hover:border-primary/60 hover:bg-card/95 ${
            pressed ? "scale-[0.985]" : "active:scale-[0.985]"
          }`}
        >
          {/* Left: Animated Cart Icon with count badge + Subtotal & item details */}
          <div className="flex items-center gap-2.5 min-w-0">
            <AnimatedCartIcon count={count} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-foreground">₹{total}</span>
                <span className="text-[11px] font-bold text-muted-foreground truncate">
                  · {count} {count === 1 ? "item" : "items"} in cart
                </span>
              </div>
              <p className="text-[10px] font-bold text-primary flex items-center gap-1 leading-tight">
                <Sparkles className="size-2.5 fill-primary/20" />
                <span>Tap to review & proceed</span>
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
            className="ripple shrink-0 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-cta transition-all duration-200 hover:brightness-105 active:scale-95 cursor-pointer"
          >
            <span>View Cart</span>
            <ArrowRight className="size-3.5 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  return createPortal(bar, document.body);
}

