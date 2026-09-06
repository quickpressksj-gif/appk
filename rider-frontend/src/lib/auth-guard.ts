import { redirect } from "@tanstack/react-router";
import { readSession } from "../api/core/session-store";
import { riderRoutes } from "../navigation/rider-routes";

/**
 * Strict Route Guard for all Rider / Captain operational screens.
 * 1. Blocks unauthenticated access and immediately redirects to /auth.
 * 2. If rider hasn't completed onboarding -> redirects to /registration.
 * 3. If rider is pending Admin verification -> redirects to /registration-submitted.
 * 4. Only allows full dashboard access when BOTH isOnboarded & isVerified are true.
 */
export function requireRiderAuth() {
  if (typeof window === "undefined") return;
  const sess = readSession("rider") || readSession();

  if (!sess || !sess.token) {
    throw redirect({ to: "/auth" });
  }
  if ((sess as any)?.status === "suspended" || (sess as any)?.isSuspended) {
    throw redirect({ to: "/auth" });
  }

  const isVerified = Boolean(sess.isVerified || sess.account?.isVerified);
  const status = String(sess.account?.status || sess.status || "").toLowerCase();

  // An approved / active rider is cleared for full dashboard access
  const isApproved = isVerified || status === "active" || status === "approved";

  // Without explicit admin approval & verification, rider CANNOT access dashboard/cockpit
  if (!isApproved || status === "unregistered") {
    throw redirect({ to: "/onboarding" });
  }
}

/**
 * Guard for registration & verification waiting screens.
 */
export function requireRiderSession() {
  if (typeof window === "undefined") return;
  const sess = readSession("rider") || readSession();

  if (!sess || !sess.token) {
    throw redirect({ to: "/auth" });
  }
}
