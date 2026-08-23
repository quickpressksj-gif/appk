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

import { readSession, writeSession } from "../core/session-store";

export async function submitRiderRegistration(payload: unknown): Promise<RiderSession> {
  const res = await apiPostJson<{
    ok: true;
    riderId: string;
    phone: string;
    fullName: string;
    isVerified: boolean;
    isOnboarded: boolean;
  }>("/api/rider/onboarding", { payload });

  const currentSession = readSession(ROLE);
  if (currentSession && currentSession.account) {
    const updatedSession = {
      ...currentSession,
      account: {
        ...currentSession.account,
        name: res.fullName || currentSession.account.name,
        linkedId: res.riderId,
        isVerified: res.isVerified,
        isOnboarded: res.isOnboarded,
      },
    };
    writeSession(updatedSession, ROLE);
  }

  return {
    riderId: res.riderId,
    phone: res.phone,
    fullName: res.fullName,
    isVerified: res.isVerified,
    isOnboarded: res.isOnboarded,
    isNewRider: !res.isOnboarded,
  };
}

export async function checkRiderVerificationStatus(): Promise<{
  isVerified: boolean;
  status: string;
  fullName: string;
  riderId: string;
}> {
  try {
    const me = await apiGetJson<{
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      role: string;
      status?: string;
      isVerified?: boolean;
      isOnboarded?: boolean;
      linkedId?: string;
    }>("/api/auth/me");

    const isVerified = Boolean(me.isVerified || me.status === "active");
    const currentSession = readSession(ROLE);
    if (currentSession && currentSession.account) {
      const updatedSession = {
        ...currentSession,
        isVerified,
        isOnboarded: Boolean(me.isOnboarded),
        account: {
          ...currentSession.account,
          isVerified,
          isOnboarded: Boolean(me.isOnboarded),
          name: me.name || currentSession.account.name,
          linkedId: me.linkedId || currentSession.account.linkedId,
        },
      };
      writeSession(updatedSession, ROLE);
    }

    return {
      isVerified,
      status: me.status || (isVerified ? "active" : "pending"),
      fullName: me.name || "Delivery Partner",
      riderId: me.linkedId || me.id,
    };
  } catch {
    return {
      isVerified: false,
      status: "pending",
      fullName: "",
      riderId: "",
    };
  }
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
