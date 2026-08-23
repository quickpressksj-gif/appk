/** POST /api/auth/* — mock authentication against the shared QuickPress backend. */
import type { AuthSession } from "@/shared/types";
import { apiPostJson } from "@/api/core/transport";
import { clearSession, writeSession } from "@/api/core/session-store";

import {
  adminLoginWithGoogle,
  adminSignOut,
  rememberAdminLogin,
  refreshAdminSession,
  restoreAdminSession,
  startAdminAutoRefresh,
} from "@/api/admin/admin-auth-api";

export type AdminSession = {
  token: string;
  email: string;
  name: string;
  role: string;
  twoFactorRequired: boolean;
};

/** POST /api/auth/admin/pin — authenticate with 4-digit Master Passcode (4502). */
export async function adminPinLogin(pin: string): Promise<AdminSession> {
  const session = await apiPostJson<AuthSession>(
    "/api/auth/admin/pin",
    { pin, role: "admin" },
    { anonymous: true },
  );
  writeSession(session, "admin");
  return {
    token: session.token,
    email: session.account.email || "admin@quickpress.online",
    name: session.account.name || "QuickPress Super Admin",
    role: "Super admin",
    twoFactorRequired: false,
  };
}

/** POST /api/auth/login — dummy admin: admin@quickpress.test / any password. */
export async function adminLogin(input: {
  email: string;
  password: string;
}): Promise<AdminSession> {
  const session = await apiPostJson<AuthSession>(
    "/api/auth/login",
    { ...input, role: "admin" },
    { anonymous: true },
  );
  writeSession(session, "admin");
  return {
    token: session.token,
    email: session.account.email,
    name: session.account.name,
    role: "Super admin",
    // The backend has no 2FA endpoint yet, so we never gate sign-in on it.
    twoFactorRequired: false,
  };
}

/** No /api/auth/2fa endpoint exists on the backend yet. */
export function verifyTwoFactor(_input: { code: string }): Promise<{ verified: boolean }> {
  return Promise.reject(new Error("Two-factor verification is not available yet."));
}

/** No /api/auth/forgot-password endpoint exists on the backend yet. */
export function requestPasswordReset(_email: string): Promise<{ sent: boolean; email: string }> {
  return Promise.reject(new Error("Password reset requests are not available yet. Contact your platform administrator."));
}

/** POST /api/auth/logout — clears the Firebase user and the stored JWT pair. */
export async function adminLogout(): Promise<{ ok: boolean }> {
  await adminSignOut().catch(async () => {
    await apiPostJson("/api/auth/logout").catch(() => null);
    clearSession("admin");
  });
  return { ok: true };
}

export {
  adminLoginWithGoogle,
  rememberAdminLogin,
  refreshAdminSession,
  restoreAdminSession,
  startAdminAutoRefresh,
};
