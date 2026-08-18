// Partner auth data layer — real Firebase phone OTP + FastAPI JWT session.
import type { AccountRole, AuthSession } from "@/shared/types";
import type { BusinessRegistrationPayload, PartnerSession } from "@/shared/types/partner";

import {
  authMode,
  logout as logoutSession,
  refreshSession,
  restoreSession,
  sendPhoneOtp,
  signInWithGoogle,
  verifyPhoneOtp,
} from "../core/auth-service";
import { delay } from "../core/partner-client";
import { apiPostJson } from "../core/transport";
import { setRememberSession } from "../core/session-store";
import { startSessionAutoRefresh } from "../core/session-refresh";


const ROLE: AccountRole = "partner";

function toPartnerSession(session: AuthSession): PartnerSession {
  return {
    partnerId: session.account.linkedId ?? session.account.id,
    phone: session.account.phone,
    businessName: session.account.name ?? "",
    isVerified: session.account.isVerified,
    isOnboarded: session.account.isOnboarded,
  };
}

export async function requestOtp(phone: string) {
  const result = await sendPhoneOtp(phone, ROLE);
  return { ok: true as const, phone, expiresInSec: result.expiresInSeconds };
}

export async function verifyOtp(phone: string, code: string): Promise<PartnerSession> {
  if (authMode() === "mock") {
    return delay(
      {
        partnerId: "PRT-10482",
        phone,
        businessName: "",
        isVerified: code.length === 6,
        isOnboarded: false,
      },
      700,
    );
  }
  return toPartnerSession(await verifyPhoneOtp(phone, code, ROLE));
}

export async function loginWithGoogle(): Promise<PartnerSession> {
  return toPartnerSession(await signInWithGoogle(ROLE));
}

export async function restorePartnerSession(): Promise<PartnerSession | null> {
  const session = await restoreSession(ROLE);
  return session ? toPartnerSession(session) : null;
}

export async function refreshPartnerSession(): Promise<PartnerSession | null> {
  const session = await refreshSession(ROLE);
  return session ? toPartnerSession(session) : null;
}

export async function logout(): Promise<void> {
  return logoutSession(ROLE);
}

export async function registerBusiness(
  payload: BusinessRegistrationPayload,
): Promise<PartnerSession> {
  if (authMode() === "mock") {
    return delay(
      {
        partnerId: "PRT-10482",
        phone: "+91 98765 43210",
        businessName: payload.businessName,
        isVerified: true,
        isOnboarded: true,
      },
      820,
    );
  }
  return apiPostJson<PartnerSession>("/api/partner/onboarding", payload);
}

/** "Remember me" — keeps the partner signed in across browser restarts. */
export function rememberPartnerLogin(remember: boolean): void {
  setRememberSession(remember, ROLE);
}

/** Keeps the access token ahead of expiry while the app is open. */
export function startPartnerAutoRefresh(): () => void {
  return startSessionAutoRefresh(ROLE);
}
