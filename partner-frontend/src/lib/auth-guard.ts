import { redirect } from "@tanstack/react-router";
import { readSession } from "../api/core/session-store";
import { partnerRoutes } from "../navigation/partner-routes";

/**
 * Strict Route Guard for all partner internal screens.
 * Blocks unauthenticated access and immediately redirects to /auth.
 */
export function requirePartnerAuth() {
  if (typeof window === "undefined") return;
  const sess = readSession("partner");
  if (!sess || !sess.token) {
    throw redirect({ to: partnerRoutes.auth });
  }
}
