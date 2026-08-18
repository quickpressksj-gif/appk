import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared top app bar for Wallet / Notifications / Offers.
 * Mirrors the existing QuickPress glass-panel header used across screens.
 */
export function ScreenTopBar({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 mx-auto w-full max-w-md">
      <div className="glass-panel flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => (onBack ? onBack() : navigate({ to: "/home" }))}
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-sm font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <div className="flex size-10 shrink-0 items-center justify-end">{action}</div>
      </div>
    </header>
  );
}

export function NotificationBellAction({ count = 0 }: { count?: number }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Notifications"
      onClick={() => navigate({ to: "/notifications" })}
      className="relative flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
    >
      <Bell className="size-5" />
      {count > 0 ? (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-secondary" />
      ) : null}
    </button>
  );
}
