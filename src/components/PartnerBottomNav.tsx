import { useNavigate, useRouterState } from "@tanstack/react-router";

import { partnerTabs, type PartnerTabId } from "../navigation/partner-routes";

/**
 * Partner bottom navigation — mirrors the customer app's glass pill nav.
 */
export function PartnerBottomNav({ active }: { active: PartnerTabId }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30">
      <div className="mx-auto w-full max-w-md px-4 pb-4">
        <div className="glass-panel flex items-center gap-1 overflow-hidden rounded-full p-1.5 shadow-soft">
          {partnerTabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (pathname === tab.to) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                  }
                  navigate({ to: tab.to });
                }}
                className={`flex items-center justify-center gap-2 rounded-full py-3 transition-all duration-300 active:scale-[0.95] ${
                  isActive
                    ? "flex-1 bg-primary/15 text-brand-dark"
                    : "px-3 text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="size-[1.1rem] shrink-0" strokeWidth={isActive ? 2.4 : 1.9} />
                {isActive ? (
                  <span className="text-sm font-semibold tracking-tight">{tab.label}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
