import { useRouter } from "@tanstack/react-router";
import { Loader2, ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 76;

/**
 * Native-feeling pull-to-refresh for the whole customer app. Only re-runs the
 * router's own loaders (`router.invalidate()`), so data fetching stays exactly
 * as each screen already defines it.
 */
export function PullToRefresh() {
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await router.invalidate();
    } finally {
      window.setTimeout(() => setRefreshing(false), 450);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 2 || event.touches.length !== 1) {
        startY.current = null;
        return;
      }
      startY.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const current = event.touches[0]?.clientY ?? 0;
      const delta = current - startY.current;
      if (delta <= 0 || window.scrollY > 2) {
        setPull(0);
        return;
      }
      setPull(Math.min(delta * 0.5, THRESHOLD + 24));
    };

    const onTouchEnd = () => {
      if (pull >= THRESHOLD && !refreshing) void refresh();
      startY.current = null;
      setPull(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, refresh, refreshing]);

  const active = refreshing || pull > 4;
  if (!active) return null;

  const offset = refreshing ? 18 : Math.max(pull - 8, 4);
  const ready = pull >= THRESHOLD;

  return (
    <div
      aria-hidden
      className="qpc-ptr"
      style={{
        transform: `translateY(${offset}px)`,
        opacity: refreshing ? 1 : Math.min(pull / THRESHOLD, 1),
      }}
    >
      {refreshing ? (
        <Loader2 className="size-4 animate-spin text-primary" />
      ) : (
        <ArrowDown
          className="size-4 text-primary transition-transform duration-200"
          style={{ transform: ready ? "rotate(180deg)" : "none" }}
        />
      )}
    </div>
  );
}
