import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

import { partnerTabs, type PartnerTabId } from "../navigation/partner-routes";

/**
 * Partner bottom navigation — exactly matches the customer app's glass dock pill nav.
 */
export function PartnerBottomNav({ active }: { active: PartnerTabId }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pressed, setPressed] = useState<string | null>(null);

  const bump = (id: string) => {
    setPressed(id);
    window.setTimeout(() => setPressed((p) => (p === id ? null : p)), 320);
  };

  return (
    <nav
      aria-label="Partner Navigation"
      className="fixed inset-x-0 bottom-0 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1"
    >
      <div className="mx-auto w-full max-w-md px-4">
        <div className="flex items-stretch gap-1 rounded-full border border-border/50 bg-card/85 p-1.5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          {partnerTabs.map((tab) => {
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
                className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 transition-all duration-300 ease-out active:scale-95 ${
                  isActive
                    ? "bg-primary/20 text-brand-dark dark:text-primary font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon
                  className={`size-[1.15rem] shrink-0 transition-transform duration-300 ease-out ${
                    pressed === tab.id ? "scale-125" : isActive ? "scale-110" : "scale-100"
                  }`}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                <span
                  className={`text-[0.68rem] leading-none tracking-tight ${
                    isActive ? "font-black" : "font-semibold"
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
