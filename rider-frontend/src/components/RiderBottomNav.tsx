import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, ClipboardList, type LucideIcon } from "lucide-react";

export type RiderTabId = "dashboard" | "orders";

type TabItem = {
  id: RiderTabId;
  label: string;
  icon: LucideIcon;
  to: string;
};

// Strictly 2 bottom tabs: Home & Orders (Same as Customer Panel layout)
const RIDER_TABS: TabItem[] = [
  { id: "dashboard", label: "Home", icon: Home, to: "/dashboard" },
  { id: "orders", label: "Orders", icon: ClipboardList, to: "/orders" },
];

interface RiderBottomNavProps {
  active?: RiderTabId;
  ordersBadgeCount?: number;
}

export function RiderBottomNav({ active = "dashboard", ordersBadgeCount = 0 }: RiderBottomNavProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pressed, setPressed] = useState<string | null>(null);

  // Preload tab routes for instant response on tap
  useEffect(() => {
    const idle =
      (window as any).requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 400));
    const handle = idle(() => {
      RIDER_TABS.forEach((item) => void router.preloadRoute({ to: item.to as any }).catch(() => undefined));
    });
    return () => {
      const cancel = (window as any).cancelIdleCallback;
      if (cancel) cancel(handle);
      else window.clearTimeout(handle as number);
    };
  }, [router]);

  const bump = (id: string) => {
    setPressed(id);
    window.setTimeout(() => setPressed((p) => (p === id ? null : p)), 300);
  };

  const go = (id: string, to: string) => {
    bump(id);
    if (pathname === to) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate({ to: to as any });
  };

  const bar = (
    <nav
      aria-label="Captain Primary Bottom Navigation"
      className="fixed inset-x-0 bottom-0 z-40 pt-1 transition-[transform,opacity] duration-300 select-none pointer-events-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 8px, 14px)" }}
    >
      {/* Floating Glass Dock (Matching Customer Panel Style) */}
      <div className="mx-auto w-full max-w-md px-4 pointer-events-auto">
        <div className="flex items-stretch gap-1 rounded-full border border-neutral-200/70 bg-white/90 p-1.5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          {RIDER_TABS.map((item) => {
            const isActive =
              item.id === active ||
              pathname === item.to ||
              (item.id === "dashboard" && (pathname === "/" || pathname === "/dashboard"));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id, item.to)}
                onPointerEnter={() => void router.preloadRoute({ to: item.to as any }).catch(() => undefined)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-3 py-2 transition-all duration-300 ease-out cursor-pointer ${
                  isActive
                    ? "bg-[#00C853]/15 text-[#00C853]"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <item.icon
                    className={`size-[1.25rem] shrink-0 transition-transform duration-300 ease-out ${
                      pressed === item.id ? "scale-[1.22]" : isActive ? "scale-110" : "scale-100"
                    }`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />

                  {/* Orders Pending Count Badge */}
                  {item.id === "orders" && ordersBadgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-3 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[9px] font-black text-white bg-red-600 rounded-full border-2 border-white shadow-xs animate-pulse">
                      {ordersBadgeCount}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[0.7rem] leading-none tracking-[-0.01em] transition-all duration-200 ${
                    isActive ? "font-black text-[#00C853]" : "font-semibold text-neutral-500"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );

  return bar;
}
