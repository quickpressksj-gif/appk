import { useEffect, useRef, useState } from "react";

/**
 * Touch pull-to-refresh for rider list screens. Mirrors the behaviour used by
 * the customer and partner apps: drag past the threshold to trigger a reload.
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 72) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const handleStart = (event: TouchEvent) => {
      if (window.scrollY > 4 || refreshing) return;
      startY.current = event.touches[0]?.clientY ?? null;
    };

    const handleMove = (event: TouchEvent) => {
      if (startY.current === null) return;
      const delta = (event.touches[0]?.clientY ?? 0) - startY.current;
      setPull(delta > 0 ? Math.min(delta * 0.5, threshold + 24) : 0);
    };

    const handleEnd = () => {
      if (pull >= threshold) {
        setRefreshing(true);
        void Promise.resolve(onRefresh()).finally(() => {
          setRefreshing(false);
          setPull(0);
        });
      } else {
        setPull(0);
      }
      startY.current = null;
    };

    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [pull, refreshing, threshold, onRefresh]);

  return { pull, refreshing, progress: Math.min(pull / threshold, 1) };
}
