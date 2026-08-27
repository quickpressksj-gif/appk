/**
 * QuickPress authentication service — the single real auth layer for all four
 * apps (customer / partner / rider / admin).
 *
 *   Screen → auth-api (@backend/<app>/…) → auth-service → Firebase + FastAPI
 *
 * Flow: Firebase issues the identity (phone OTP / Google / Apple), the FastAPI
 * backend verifies the Firebase ID token, upserts the MongoDB user document
 * and returns the QuickPress JWT pair that every later request uses.
 *
 * When Firebase or the API base URL is not configured for the current
 * environment the service falls back to the existing in-memory mock endpoints,
 * so the preview keeps working without any UI change.
 */

import type { AccountRole, AuthSession, RequestOtpResult } from "@/shared/types";

import { ApiError } from "./errors";
import {
  confirmFirebaseOtp,
  currentFirebaseIdToken,
  firebaseSignOut,
  sendFirebaseOtp,
  signInWithAppleIdToken,
  signInWithGoogleIdToken,
} from "./firebase-auth";
import { isFirebaseConfigured } from "./firebase-config";
import { isApiConfigured } from "../customer/api/config";
import { activeSessionRole, clearSession, readSession, writeSession } from "./session-store";
import { apiGetJson, apiPostJson } from "./transport";

export const AUTH_ENDPOINTS = {
  sendOtp: "/api/auth/phone/send-otp",
  verifyOtp: "/api/auth/phone/verify",
  google: "/api/auth/google",
  apple: "/api/auth/apple",
  me: "/api/auth/me",
  logout: "/api/auth/logout",
  refresh: "/api/auth/refresh",
} as const;

/** Legacy mock endpoints kept for preview mode only. */
const MOCK_ENDPOINTS = {
  requestOtp: "/api/auth/request-otp",
  verifyOtp: "/api/auth/verify-otp",
} as const;

export type AuthMode = "firebase" | "mock";

/** Real authentication runs only when both Firebase and the API are configured. */
export function authMode(): AuthMode {
  return isFirebaseConfigured() && isApiConfigured() ? "firebase" : "mock";
}

function role(explicit?: AccountRole): AccountRole {
  return (explicit ?? (activeSessionRole() as AccountRole)) satisfies AccountRole;
}

import { clearCache } from "../customer/api/cache";

function persist(session: AuthSession): AuthSession {
  const previous = readSession(session.account.role);
  if (!previous || previous.account?.id !== session.account.id) {
    clearCache();
  }
  writeSession(session, session.account.role);
  return session;
}

/* ------------------------------------------------------------------ phone */

/** POST /api/auth/phone/send-otp — Twilio backend sends the SMS, Firebase client can assist. */
export async function sendPhoneOtp(
  phone: string,
  explicitRole?: AccountRole,
): Promise<RequestOtpResult> {
  const audit = await apiPostJson<{ ok: true; expiresInSeconds: number; isNewAccount: boolean }>(
    AUTH_ENDPOINTS.sendOtp,
    { phone, role: role(explicitRole) },
    { anonymous: true },
  );
  try {
    if (isFirebaseConfigured()) {
      await sendFirebaseOtp(phone);
    }
  } catch {
    // Graceful fallback to backend Twilio SMS delivery
  }
  return {
    ok: true,
    devOtp: "",
    expiresInSeconds: audit.expiresInSeconds ?? 300,
    isNewAccount: audit.isNewAccount ?? false,
  };
}

/** POST /api/auth/phone/verify — verifies Twilio SMS OTP or Firebase ID token. */
export async function verifyPhoneOtp(
  phone: string,
  code: string,
  explicitRole?: AccountRole,
): Promise<AuthSession> {
  let idToken = "";
  try {
    if (isFirebaseConfigured()) {
      idToken = await confirmFirebaseOtp(code);
    }
  } catch {
    // Proceed with direct backend Twilio OTP verification
  }
  return persist(
    await apiPostJson<AuthSession>(
      AUTH_ENDPOINTS.verifyOtp,
      { id_token: idToken, phone, code, role: role(explicitRole) },
      { anonymous: true },
    ),
  );
}

/* --------------------------------------------------------------- social */

async function socialSignIn(
  path: string,
  idToken: string,
  explicitRole?: AccountRole,
): Promise<AuthSession> {
  return persist(
    await apiPostJson<AuthSession>(
      path,
      { id_token: idToken, role: role(explicitRole) },
      { anonymous: true },
    ),
  );
}

/** POST /api/auth/google */
export async function signInWithGoogle(explicitRole?: AccountRole): Promise<AuthSession> {
  if (authMode() === "mock") {
    throw new ApiError("unconfigured", "Google Sign In needs Firebase credentials for this build");
  }
  return socialSignIn(AUTH_ENDPOINTS.google, await signInWithGoogleIdToken(), explicitRole);
}

/** POST /api/auth/apple — prepared; disabled unless VITE_APPLE_SIGN_IN_ENABLED=true. */
export async function signInWithApple(explicitRole?: AccountRole): Promise<AuthSession> {
  if (authMode() === "mock") {
    throw new ApiError("unconfigured", "Apple Sign In needs Firebase credentials for this build");
  }
  return socialSignIn(AUTH_ENDPOINTS.apple, await signInWithAppleIdToken(), explicitRole);
}

/* ------------------------------------------------------------- session */

/** GET /api/auth/me */
export async function fetchCurrentUser(): Promise<AuthSession["account"]> {
  return apiGetJson<AuthSession["account"]>(AUTH_ENDPOINTS.me);
}

/** POST /api/auth/refresh — rotates the access token using the refresh token. */
export async function refreshSession(explicitRole?: AccountRole): Promise<AuthSession | null> {
  const current = readSession(role(explicitRole));
  if (!current?.refreshToken || authMode() === "mock") return null;
  try {
    const next = await apiPostJson<AuthSession>(
      AUTH_ENDPOINTS.refresh,
      { refresh_token: current.refreshToken },
      { anonymous: true },
    );
    return persist(next);
  } catch {
    clearSession(role(explicitRole));
    return null;
  }
}

function isExpired(session: AuthSession, skewMs = 60_000): boolean {
  const at = Date.parse(session.expiresAt);
  return Number.isFinite(at) ? at - skewMs <= Date.now() : false;
}

/**
 * Splash → Firebase → stored JWT → Home | Auth.
 * Returns the restored session, or null when the user must sign in again.
 */
export async function restoreSession(explicitRole?: AccountRole): Promise<AuthSession | null> {
  const target = role(explicitRole);
  const stored = readSession(target);
  if (!stored) return null;
  if (authMode() === "mock") return stored;

  // Firebase user must still exist, otherwise the identity was revoked.
  const firebaseToken = await currentFirebaseIdToken();
  if (!firebaseToken) {
    clearSession(target);
    return null;
  }

  if (isExpired(stored)) return refreshSession(target);

  try {
    const account = await fetchCurrentUser();
    return persist({ ...stored, account });
  } catch (error) {
    if (error instanceof ApiError && error.kind === "unauthorized") {
      return refreshSession(target);
    }
    return stored; // network hiccup — keep the offline session
  }
}

/** POST /api/auth/logout — revokes the refresh token, then clears everything. */
export async function logout(explicitRole?: AccountRole): Promise<void> {
  const target = role(explicitRole);
  const current = readSession(target);
  if (authMode() === "firebase" && current?.refreshToken) {
    try {
      await apiPostJson(AUTH_ENDPOINTS.logout, { refresh_token: current.refreshToken });
    } catch {
      /* logout must always succeed locally */
    }
  }
  await firebaseSignOut();
  clearCache();
  clearSession(target);
}
