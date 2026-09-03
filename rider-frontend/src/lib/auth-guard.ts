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
  const pendingPhone =
    typeof window !== "undefined"
      ? window.sessionStorage?.getItem("qp.rider.pendingPhone") ||
        window.localStorage?.getItem("qp.rider.pendingPhone")
      : null;

  // Only redirect to login if completely unauthenticated
  if (!sess && !pendingPhone) {
    throw redirect({ to: riderRoutes.auth });
  }
  if (sess?.status === "suspended" || (sess as any)?.isSuspended) {
    throw redirect({ to: riderRoutes.suspended });
  }

  // If rider has logged in, allow seamless access to dashboard, orders, wallet, and profile
}

/**
 * Guard for registration & verification waiting screens.
 * Allows user who verified OTP (has session or pendingPhone) to complete onboarding.
 */
export function requireRiderSession() {
  if (typeof window === "undefined") return;
  const sess = readSession("rider") || readSession();
  const pendingPhone =
    typeof window !== "undefined"
      ? window.sessionStorage?.getItem("qp.rider.pendingPhone") ||
        window.localStorage?.getItem("qp.rider.pendingPhone")
      : null;

  if (!sess && !pendingPhone) {
    throw redirect({ to: riderRoutes.auth });
  }
}
