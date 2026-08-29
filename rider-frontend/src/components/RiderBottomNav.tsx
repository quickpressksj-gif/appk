import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { riderTabs, type RiderTabId } from "../navigation/rider-routes";

/** Scroll down → dock hides, scroll up → dock shows (matches Customer Panel behaviour). */
function useHideOnScroll() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (Math.abs(delta) < 6) return;
        if (y < 80) setVisible(true);
        else setVisible(delta < 0);
        lastY.current = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return visible;
}

/**
 * Ultra-Premium Floating Glassmorphic Bottom Navigation Bar
 * Byte-for-byte identical design language to the Customer Panel bottom nav dock.
 */
export function RiderBottomNav({ active = "dashboard" }: { active?: RiderTabId }) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pressed, setPressed] = useState<string | null>(null);
  const visible = useHideOnScroll();

  // Idle preloading for instant tab navigation on tap
  useEffect(() => {
    const idle =
      (window as any).requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 400));
    const handle = idle(() => {
      riderTabs.forEach((item) => void router.preloadRoute({ to: item.to }).catch(() => undefined));
    });
    return () => {
      const cancel = (window as any).cancelIdleCallback;
      if (cancel) cancel(handle);
      else window.clearTimeout(handle as number);
    };
  }, [router]);

  const bump = (id: string) => {
    setPressed(id);
    window.setTimeout(() => setPressed((p) => (p === id ? null : p)), 320);
  };

  const go = (id: string, to: string) => {
    bump(id);
    if (pathname === to) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate({ to });
  };

  return (
    <nav
      aria-label="Captain Primary Navigation"
      className={`fixed inset-x-0 bottom-0 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "nav-shown" : "nav-hidden"
      }`}
    >
      {/* Floating Glassmorphic Pill Dock */}
      <div className="mx-auto w-full max-w-md px-4 lg:max-w-lg">
        <div className="flex items-stretch gap-1 rounded-full border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 p-1.5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          {riderTabs.map((item) => {
            const isActive = item.id === active || pathname === item.to;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id, item.to)}
                onPointerEnter={() => void router.preloadRoute({ to: item.to }).catch(() => undefined)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-3 py-2 transition-all duration-300 ease-out ${
                  isActive
                    ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <item.icon
                  className={`size-[1.2rem] shrink-0 transition-transform duration-300 ease-out ${
                    pressed === item.id ? "scale-[1.22]" : isActive ? "scale-110" : "scale-100"
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span
                  className={`text-[0.7rem] leading-none tracking-[-0.01em] transition-all duration-200 ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
