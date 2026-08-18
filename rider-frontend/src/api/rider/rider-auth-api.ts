// Rider auth data layer — real Firebase phone OTP + FastAPI JWT session.
import type { AccountRole, AuthSession } from "@/shared/types";
import type { RiderSession } from "@/shared/types/rider";

import {
  logout as logoutSession,
  refreshSession,
  restoreSession,
  sendPhoneOtp,
  signInWithGoogle,
  verifyPhoneOtp,
} from "../core/auth-service";
import { apiGetJson, apiPostJson } from "../core/transport";
import { setRememberSession } from "../core/session-store";
import { startSessionAutoRefresh } from "../core/session-refresh";


const ROLE: AccountRole = "rider";

function toRiderSession(session: AuthSession): RiderSession {
  return {
    riderId: session.account.linkedId ?? session.account.id,
    phone: session.account.phone,
    fullName: session.account.name,
    isVerified: session.account.isVerified,
    isOnboarded: session.account.isOnboarded,
    isNewRider: !session.account.isOnboarded,
  };
}

export async function requestOtp(phone: string) {
  return sendPhoneOtp(phone, ROLE);
}

export async function verifyOtp(phone: string, code: string): Promise<RiderSession> {
  return toRiderSession(await verifyPhoneOtp(phone, code, ROLE));
}

export async function loginWithGoogle(): Promise<RiderSession> {
  return toRiderSession(await signInWithGoogle(ROLE));
}

export async function restoreRiderSession(): Promise<RiderSession | null> {
  const session = await restoreSession(ROLE);
  return session ? toRiderSession(session) : null;
}

export async function refreshRiderSession(): Promise<RiderSession | null> {
  const session = await refreshSession(ROLE);
  return session ? toRiderSession(session) : null;
}

export async function logout(): Promise<void> {
  return logoutSession(ROLE);
}

export async function submitRiderRegistration(payload: unknown) {
  return apiPostJson<{ ok: true; payload: unknown }>("/api/rider/auth/registration", { payload });
}

export async function fetchExistingRiderNumbers(): Promise<string[]> {
  return apiGetJson<string[]>("/api/rider/auth/existing-numbers");
}

/** "Remember me" — keeps the rider signed in across browser restarts. */
export function rememberRiderLogin(remember: boolean): void {
  setRememberSession(remember, ROLE);
}

/** Keeps the access token ahead of expiry while the app is open. */
export function startRiderAutoRefresh(): () => void {
  return startSessionAutoRefresh(ROLE);
}
