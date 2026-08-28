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
    phone: session.account.phone ?? "",
    email: session.account.email,
    businessName: session.account.name ?? "",
    isVerified: session.account.isVerified,
    isOnboarded: session.account.isOnboarded,
  };
}

function toE164(phone: string): string {
  const cleaned = phone.trim();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (!cleaned.startsWith("+") && digits) return `+${digits}`;
  return cleaned;
}

export async function requestOtp(phone: string) {
  const e164 = toE164(phone);
  const result = await sendPhoneOtp(e164, ROLE);
  return { ok: true as const, phone: e164, expiresInSec: result.expiresInSeconds };
}

export async function verifyOtp(phone: string, code: string): Promise<PartnerSession> {
  const e164 = toE164(phone);
  return toPartnerSession(await verifyPhoneOtp(e164, code, ROLE));
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
  return apiPostJson<PartnerSession>("/api/partner/onboarding", payload);
}

/** Check if Admin has approved the partner in backend/MongoDB. */
export async function checkPartnerVerificationStatus(): Promise<{
  isVerified: boolean;
  status: string;
  businessName: string;
  partnerId: string;
}> {
  if (authMode() === "mock") {
    return {
      isVerified: false,
      status: "pending",
      businessName: "QuickPress Partner Store",
      partnerId: "PRT-10482",
    };
  }
  try {
    const profile = await apiGetJson<{
      partnerId: string;
      businessName: string;
      isVerified?: boolean;
      status?: string;
    }>("/api/partner/profile");

    const isVerified = Boolean(profile.isVerified || profile.status === "active");
    const currentSession = readSession(ROLE);
    if (currentSession && currentSession.account) {
      const updatedSession = {
        ...currentSession,
        account: {
          ...currentSession.account,
          isVerified,
          isOnboarded: true,
          name: profile.businessName || currentSession.account.name,
        },
      };
      writeSession(updatedSession, ROLE);
    }

    return {
      isVerified,
      status: profile.status || (isVerified ? "active" : "pending"),
      businessName: profile.businessName,
      partnerId: profile.partnerId,
    };
  } catch {
    return {
      isVerified: false,
      status: "pending",
      businessName: "",
      partnerId: "",
    };
  }
}

/** "Remember me" — keeps the partner signed in across browser restarts. */
export function rememberPartnerLogin(remember: boolean): void {
  setRememberSession(remember, ROLE);
}

/** Keeps the access token ahead of expiry while the app is open. */
export function startPartnerAutoRefresh(): () => void {
  return startSessionAutoRefresh(ROLE);
}
