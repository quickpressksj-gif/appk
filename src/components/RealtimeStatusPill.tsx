import { Radio, WifiOff } from "lucide-react";

import { useRealtimeConnection } from "@shared/hooks/use-realtime";

/**
 * Sprint 5.5 — Socket.IO connection indicator.
 * Purely additive: shows live / reconnecting / offline state of the shared
 * realtime connection and offers a manual reconnect.
 */
export function RealtimeStatusPill({ className = "" }: { className?: string }) {
  const { status, mode, reconnect } = useRealtimeConnection();

  const connected = status === "connected";
  const offline = status === "offline";

  const label = offline
    ? "Offline"
    : connected
      ? mode === "live"
        ? "Live"
        : "Live (sim)"
      : status === "reconnecting"
        ? "Reconnecting…"
        : "Connecting…";

  return (
    <button
      type="button"
      onClick={reconnect}
      title={`Realtime: ${status} (${mode})`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-muted-foreground ${className}`}
    >
      {offline ? (
        <WifiOff className="size-3 text-destructive" />
      ) : (
        <Radio
          className={`size-3 ${connected ? "text-brand-green" : "animate-pulse text-primary"}`}
        />
      )}
      {label}
    </button>
  );
}
