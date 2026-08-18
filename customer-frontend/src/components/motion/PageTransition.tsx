import { useRouterState } from "@tanstack/react-router";
import { memo, type ReactNode } from "react";

/**
 * Wraps the routed content and replays a fade + slide-up entrance on every
 * navigation. Keyed by pathname so React remounts the subtree and the CSS
 * animation restarts. Presentation only — no routing behaviour changes.
 */
export const PageTransition = memo(function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div key={pathname} className="page-enter min-h-screen">
      {children}
    </div>
  );
});
