/**
 * Route guard for the QuickPress Admin console.
 *
 * Every admin screen except /auth and /forgot-password is operator-only.
 * Without this guard the whole console (orders, customers, payouts, staff,
 * settings) rendered for anyone who typed the URL directly.
 *
 * This is a UX guard only — the authoritative check lives on the server, where
 * every /api/admin/* route requires the admin role. Never rely on this alone.
 */
import { redirect } from "@tanstack/react-router";

import { readSession, sessionExpiresAt } from "@/api/core/session-store";

import { adminRoutes } from "../navigation/admin-routes";

/** Use as `beforeLoad: requireAdminSession` on protected admin routes. */
export function requireAdminSession(): void {
  // The session lives in browser storage, so SSR/prerender can't evaluate it.
  // The client re-runs beforeLoad on hydration and redirects there.
  if (typeof window === "undefined") return;

  const session = readSession("admin");
  const expiresAt = sessionExpiresAt("admin");
  const expired = typeof expiresAt === "number" && expiresAt <= Date.now();

  if (!session?.token || expired) {
    throw redirect({ to: adminRoutes.auth });
  }
}
