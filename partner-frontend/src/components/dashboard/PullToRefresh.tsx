import { RefreshCw } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

/**
 * Sprint 3.2 — lightweight pull-to-refresh for the partner dashboard.
 * Touch-only, UI feedback only (no API calls).
 */
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const threshold = 70;

  return (
    <div
      onTouchStart={(e) => {
        if (window.scrollY > 0 || refreshing) return;
        startY.current = e.touches[0]?.clientY ?? null;
      }}
      onTouchMove={(e) => {
        if (startY.current === null) return;
        const delta = (e.touches[0]?.clientY ?? 0) - startY.current;
        if (delta > 0) setPull(Math.min(100, delta * 0.5));
      }}
      onTouchEnd={() => {
        startY.current = null;
        if (pull >= threshold) {
          setRefreshing(true);
          void Promise.resolve(onRefresh()).finally(() => {
            setRefreshing(false);
            setPull(0);
          });
        } else {
          setPull(0);
        }
      }}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{ height: refreshing ? 44 : pull }}
      >
        <RefreshCw
          className={`size-5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}
        />
      </div>
      <div
        className="transition-transform duration-300"
        style={{ transform: `translateY(${refreshing ? 0 : 0}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
