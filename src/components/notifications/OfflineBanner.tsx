import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/** Sprint 3.8 — offline empty/notice state (browser online status only). */
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

export function OfflineBanner({ message }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="card-soft animate-soft-fade mt-4 flex items-center gap-3 border border-destructive/40 bg-destructive/5 p-4"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <WifiOff className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight text-foreground">You are offline</p>
        <p className="text-[0.72rem] font-medium text-muted-foreground">
          {message ?? "Showing the last synced data. Reconnect to receive live updates."}
        </p>
      </div>
    </div>
  );
}