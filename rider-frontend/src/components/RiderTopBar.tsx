import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import type { ReactNode } from "react";

import { riderRoutes } from "../navigation/rider-routes";

/** Modern, ultra-clean White & Black Rider Top Header */
export function RiderTopBar({
  title,
  subtitle,
  onBack,
  showBack = true,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  action?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 mx-auto w-full max-w-md lg:max-w-3xl border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md transition-all">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            type="button"
            aria-label="Go back"
            onClick={() => (onBack ? onBack() : navigate({ to: riderRoutes.dashboard }))}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.95]"
          >
            <ArrowLeft className="size-4.5" strokeWidth={2.2} />
          </button>
        ) : (
          <div className="size-9 shrink-0" />
        )}
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[15px] font-black tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-[11px] font-semibold text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-end">{action}</div>
      </div>
    </header>
  );
}

export function RiderBellAction({ count = 0 }: { count?: number }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Notifications"
      onClick={() => navigate({ to: riderRoutes.notifications })}
      className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.95]"
    >
      <Bell className="size-4.5" strokeWidth={2} />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
          {count}
        </span>
      ) : null}
    </button>
  );
}
