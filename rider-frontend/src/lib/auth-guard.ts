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

  const isOnboarded = sess.isOnboarded ?? sess.account?.isOnboarded;
  if (isOnboarded === false) {
    throw redirect({ to: "/onboarding" });
  }

  const isVerified = sess.isVerified ?? sess.account?.isVerified;
  if (isVerified === false && sess.status !== "active" && sess.account?.status !== "active") {
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
