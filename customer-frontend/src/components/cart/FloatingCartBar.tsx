import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useCart } from "@/hooks/useCart";

/**
 * Blinkit-style Floating "View Cart" Pill Bar:
 * - Rich green pill: `#0c831f`
 * - Left: Overlapping circular item thumbnails with white borders
 * - Center: "View cart" (bold white) and "X items" (soft white)
 * - Right: Chevron right arrow
 * - Navigates directly to `/cart` on tap
 */
export function FloatingCartBar({
  hasBottomNav,
}: {
  hasBottomNav?: boolean;
}) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count, total, lines } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload cart route in background for 0ms instant open
  useEffect(() => {
    if (count > 0) {
      void router.preloadRoute({ to: "/cart" }).catch(() => undefined);
    }
  }, [count, router]);

  // Don't show floating bar on checkout, cart, or success pages
  if (!mounted || count === 0 || pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/order-success")) {
    return null;
  }

  // Auto-detect if current page has bottom navbar
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

  // Up to 3 item thumbnails
  const displayItems = lines.slice(0, 3);

  const bar = (
    <aside
      aria-label="Floating View Cart Bar"
      className={`fixed inset-x-0 ${
        showAboveNav
          ? "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.25rem)]"
          : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1"
      } z-40 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-none`}
    >
      <div className="mx-auto w-full max-w-md px-4">
        <Link
          to="/cart"
          className="group pointer-events-auto flex items-center justify-between gap-3 rounded-2xl bg-[#0c831f] hover:bg-emerald-800 px-4 py-2.5 text-white shadow-xl shadow-emerald-950/25 transition-all duration-200 cursor-pointer active:scale-[0.98]"
        >
          {/* Left: Overlapping circular item thumbnails + View Cart text */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Overlapping circular product thumbnails */}
            <div className="flex items-center -space-x-3 shrink-0">
              {displayItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="size-9 rounded-full border-2 border-white bg-white overflow-hidden shadow-xs flex items-center justify-center shrink-0"
                  style={{ zIndex: 10 - idx }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full bg-emerald-100 flex items-center justify-center text-[#0c831f] text-[11px] font-black uppercase">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View Cart & Item Count Text */}
            <div className="min-w-0">
              <p className="text-sm font-black text-white leading-tight tracking-tight">
                View cart
              </p>
              <p className="text-[11px] font-semibold text-white/90 leading-tight mt-0.5 truncate">
                {count} {count === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          {/* Right: Subtotal & Chevron Right Arrow */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm font-black text-white tracking-tight">
              ₹{total}
            </span>
            <ChevronRight className="size-5 text-white stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>
    </aside>
  );

  return createPortal(bar, document.body);
}
