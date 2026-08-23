import { useNavigate, useRouterState } from "@tanstack/react-router";

import { riderTabs, type RiderTabId } from "../navigation/rider-routes";

/** Modern Mobile Bottom Navigation Bar — Clean White & Black Theme */
export function RiderBottomNav({ active }: { active: RiderTabId }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md lg:max-w-3xl pointer-events-none">
      <div className="px-4 pb-3 pt-1 pointer-events-auto">
        <div className="flex items-center justify-around rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all">
          {riderTabs.map((tab) => {
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
                className={`group flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 transition-all duration-300 active:scale-[0.94] ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <tab.icon
                  className={`size-[1.15rem] shrink-0 transition-transform ${
                    isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-800"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive ? (
                  <span className="text-[12px] font-extrabold tracking-tight text-white animate-fade-in">
                    {tab.label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
