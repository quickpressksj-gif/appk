import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type RiderTabId = "dashboard" | "orders" | "wallet" | "profile";

type TabItem = {
  id: RiderTabId;
  label: string;
  icon: LucideIcon;
  to: string;
};

const RIDER_TABS: TabItem[] = [
  { id: "dashboard", label: "Hub", icon: LayoutDashboard, to: "/dashboard" },
  { id: "orders", label: "Orders", icon: ClipboardList, to: "/orders" },
  { id: "wallet", label: "Finance", icon: Wallet, to: "/wallet" },
  { id: "profile", label: "More", icon: UserRound, to: "/profile" },
];

export function RiderBottomNav({ active }: { active: RiderTabId }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pressed, setPressed] = useState<string | null>(null);

  const bump = (id: string) => {
    setPressed(id);
    window.setTimeout(() => setPressed((p) => (p === id ? null : p)), 320);
  };

  return (
    <nav
      aria-label="Captain Navigation"
      className="fixed inset-x-0 bottom-0 z-30 pt-1 lg:hidden"
      style={{ paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 8px), 16px)" }}
    >
      <div className="mx-auto w-full max-w-md px-4">
        <div className="flex items-stretch gap-1 rounded-full border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
          {RIDER_TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  bump(tab.id);
                  if (pathname === tab.to) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                  }
                  navigate({ to: tab.to });
                }}
                className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 transition-all duration-300 ease-out active:scale-95 cursor-pointer ${
                  isActive
                    ? "bg-emerald-800 text-white font-bold shadow-xs"
                    : "text-emerald-950/70 hover:text-emerald-900"
                }`}
              >
                <tab.icon
                  className={`size-[1.15rem] shrink-0 transition-transform duration-300 ease-out ${
                    pressed === tab.id ? "scale-125" : isActive ? "scale-110" : "scale-100"
                  }`}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                <span
                  className={`text-[0.68rem] leading-none tracking-tight ${
                    isActive ? "font-black text-white" : "font-semibold text-emerald-950/80"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
