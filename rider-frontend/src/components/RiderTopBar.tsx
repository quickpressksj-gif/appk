import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import type { ReactNode } from "react";

import { riderRoutes } from "../navigation/rider-routes";

/** Rider top app bar — same glass-panel header used across QuickPress apps. */
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
    <header className="sticky top-0 z-30 mx-auto w-full max-w-md">
      <div className="glass-panel flex items-center gap-2 px-4 py-3">
        {showBack ? (
          <button
            type="button"
            aria-label="Go back"
            onClick={() => (onBack ? onBack() : navigate({ to: riderRoutes.dashboard }))}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <div className="size-10 shrink-0" />
        )}
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-sm font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="truncate text-[0.68rem] font-medium text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-end">{action}</div>
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
      className="relative flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
    >
      <Bell className="size-5" />
      {count > 0 ? (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-secondary" />
      ) : null}
    </button>
  );
}
