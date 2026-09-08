import { redirect } from "@tanstack/react-router";
import { readSession } from "../api/core/session-store";

/**
 * Checks if the current rider session is fully verified and approved by admin.
 */
export function isRiderApproved(sess: any): boolean {
  if (!sess) return false;

  if (sess.status === "suspended" || sess.isSuspended) {
    return false;
  }

  // 1. Direct verified flags (check root & account, camelCase & snake_case)
  if (
    sess.isVerified === true ||
    sess.is_verified === true ||
    sess.account?.isVerified === true ||
    sess.account?.is_verified === true
  ) {
    return true;
  }

  // 2. KYC status
  if (
    sess.kycStatus === "verified" ||
    sess.kyc_status === "verified" ||
    sess.account?.kycStatus === "verified" ||
    sess.account?.kyc_status === "verified"
  ) {
    return true;
  }

  // 3. User account status
  if (
    sess.status === "active" ||
    sess.status === "approved" ||
    sess.account?.status === "active" ||
    sess.account?.status === "approved"
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if rider has submitted registration documents / profile.
 */
export function isRiderOnboarded(sess: any): boolean {
  if (!sess) return false;

  // If already approved, they are definitely onboarded!
  if (isRiderApproved(sess)) return true;

  // Direct boolean flags
  if (
    sess.isOnboarded === true ||
    sess.is_onboarded === true ||
    sess.account?.isOnboarded === true ||
    sess.account?.is_onboarded === true
  ) {
    return true;
  }

  // If rider has a recognized name (other than default generic placeholders) or riderId, they have onboarded!
  const name = sess.account?.name || sess.fullName || sess.name || "";
  if (name && name !== "Captain" && name !== "Delivery Partner" && name.trim().length > 0) {
    return true;
  }

  const riderId = sess.riderId || sess.account?.linkedId || sess.account?.id;
  if (riderId && (riderId.startsWith("RDR-") || riderId.startsWith("rdr_"))) {
    return true;
  }

  return false;
}

/**
 * Strict Route Guard for all Rider / Captain operational screens.
 * 1. Blocks unauthenticated access and immediately redirects to /auth.
 * 2. If rider hasn't registered at all, redirects to /registration.
 * 3. Blocks unapproved riders (under verification / pending admin approval) and redirects to /verification.
 * 4. Only allows verified & approved riders to access operational screens (/dashboard, /orders, /wallet, etc.).
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

  // 1. If rider has NOT completed registration form at all, redirect to /registration
  if (!isRiderOnboarded(sess)) {
    throw redirect({ to: "/registration" });
  }

  // 2. If rider completed registration but is NOT yet approved by admin, redirect to /verification
  if (!isRiderApproved(sess)) {
    throw redirect({ to: "/verification" });
  }

  // 3. Approved & onboarded -> Allow access to operational screens!
}

/**
 * Guard for registration & verification waiting screens.
 * Allows authenticated riders to access /verification or /registration even if not yet approved.
 */
export function requireRiderSession() {
  if (typeof window === "undefined") return;
  const sess = readSession("rider") || readSession();

  if (!sess || !sess.token) {
    throw redirect({ to: "/auth" });
  }

  if ((sess as any)?.status === "suspended" || (sess as any)?.isSuspended) {
    throw redirect({ to: "/auth" });
  }
}
