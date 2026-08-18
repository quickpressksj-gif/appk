import { Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { usePullToRefresh } from "../../hooks/use-pull-to-refresh";

/** Shared pull-to-refresh wrapper for the wallet and history screens. */
export function PullToRefreshShell({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const { pull, refreshing, progress } = usePullToRefresh(onRefresh);

  return (
    <div style={{ transform: `translateY(${pull}px)` }} className="transition-transform duration-150">
      {pull > 0 || refreshing ? (
        <div className="flex items-center justify-center py-2" role="status" aria-live="polite">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {refreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" style={{ transform: `rotate(${progress * 270}deg)` }} />
            )}
          </span>
        </div>
      ) : null}
      {children}
    </div>
  );
}