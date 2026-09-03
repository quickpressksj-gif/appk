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
      {/* Rapido Captain High-Contrast Dock */}
      <div className="mx-auto w-full max-w-md px-3 lg:max-w-lg">
        <div className="flex items-stretch gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]">
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
                className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ease-out cursor-pointer ${
                  isActive
                    ? "bg-amber-400 text-slate-950 shadow-sm font-black scale-[1.02]"
                    : "text-slate-500 hover:text-slate-950 hover:bg-slate-50 font-semibold"
                }`}
              >
                <item.icon
                  className={`size-[1.2rem] shrink-0 transition-transform duration-200 ${
                    pressed === item.id ? "scale-125" : isActive ? "scale-110" : "scale-100"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={`text-[0.7rem] leading-none tracking-tight ${
                    isActive ? "font-black text-slate-950" : "font-medium"
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
