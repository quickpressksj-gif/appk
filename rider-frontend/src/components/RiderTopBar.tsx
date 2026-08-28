import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, Wifi } from "lucide-react";
import type { ReactNode } from "react";

import { useRiderContext } from "../context/RiderContext";
import { riderRoutes } from "../navigation/rider-routes";

/** Professional FAANG-grade Rider Top Header with Live Online Beacon */
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
  const { isOnline } = useRiderContext();

  return (
    <header className="sticky top-0 z-30 mx-auto w-full max-w-md lg:max-w-3xl border-b border-slate-100/80 bg-white/90 px-4 py-3 backdrop-blur-xl transition-all">
      <div className="flex items-center justify-between gap-2.5">
        {showBack ? (
          <button
            type="button"
            aria-label="Go back"
            onClick={() => (onBack ? onBack() : navigate({ to: riderRoutes.dashboard }))}
            className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.92]"
          >
            <ArrowLeft className="size-4.5" strokeWidth={2.4} />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600">
            <span className="relative flex size-2">
              {isOnline && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex size-2 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
            </span>
            <span>{isOnline ? "LIVE" : "OFFLINE"}</span>
          </div>
        )}

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[15px] font-black tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-[11px] font-semibold text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-1.5">
          {action || <RiderBellAction count={0} />}
        </div>
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
      className="relative flex size-9 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.92]"
    >
      <Bell className="size-4.5" strokeWidth={2.2} />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
          {count}
        </span>
      ) : null}
    </button>
  );
}
