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

function toE164(phone: string): string {
  const cleaned = phone.trim();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (!cleaned.startsWith("+") && digits) return `+${digits}`;
  return cleaned;
}

export async function requestOtp(phone: string) {
  const e164 = toE164(phone);
  return sendPhoneOtp(e164, ROLE);
}

export async function verifyOtp(phone: string, code: string): Promise<RiderSession> {
  const e164 = toE164(phone);
  return toRiderSession(await verifyPhoneOtp(e164, code, ROLE));
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

export async function verifyAadhaar(aadhaarNumber: string) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    aadhaar: string;
    maskedAadhaar: string;
    verificationStatus: string;
    message: string;
  }>("/api/rider/verify/aadhaar", { aadhaarNumber });
}

export async function verifyPan(panNumber: string) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    pan: string;
    category: string;
    verificationStatus: string;
    message: string;
  }>("/api/rider/verify/pan", { panNumber });
}

export async function verifyDl(dlNumber: string) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    dlNumber: string;
    stateCode: string;
    vehicleClass: string;
    verificationStatus: string;
    message: string;
  }>("/api/rider/verify/dl", { dlNumber });
}

export async function verifyRc(rcNumber: string) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    rcNumber: string;
    vehicleClass: string;
    fuelType: string;
    verificationStatus: string;
    message: string;
  }>("/api/rider/verify/rc", { rcNumber });
}

export async function verifyIfsc(ifsc: string) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    ifsc: string;
    bank: string;
    bankName: string;
    branch: string;
    city: string;
    verificationStatus: string;
    message: string;
  }>("/api/rider/verify/ifsc", { ifsc });
}

export async function verifyInsurance(policyNumber: string, provider = "", validTill = "") {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    policyNumber: string;
    provider: string;
    validTill: string;
    verificationStatus: string;
    message: string;
  }>("/api/rider/verify/insurance", { policyNumber, provider, validTill });
}

export async function uploadRiderDocument(imageOrDataUrl: string, documentType: string, riderId?: string) {
  return apiPostJson<{
    ok: boolean;
    url: string;
    documentType: string;
    field: string;
  }>("/api/uploads/rider/document", { image: imageOrDataUrl, documentType, riderId });
}

export async function fetchOnboardingStatus(phone?: string, riderId?: string) {
  const params: Record<string, string> = {};
  if (phone) params.phone = phone;
  if (riderId) params.rider_id = riderId;
  return apiGetJson<{
    ok: boolean;
    riderId: string;
    status: string;
    isVerified: boolean;
    fullName?: string;
    phone?: string;
    documents?: Record<string, boolean>;
    step?: number;
  }>("/api/rider/onboarding/status", { params });
}

/** Check if Admin has approved the rider in backend/MongoDB. */
export async function checkRiderVerificationStatus(riderId: string): Promise<boolean> {
  try {
    const res = await apiGetJson<{
      id: string;
      isVerified: boolean;
      status?: string;
    }>(`/api/rider/profile`);
    return Boolean(res.isVerified || res.status === "active" || res.status === "approved");
  } catch {
    const onboarding = await fetchOnboardingStatus(undefined, riderId).catch(() => null);
    return Boolean(onboarding?.isVerified);
  }
}

export async function getMe(): Promise<{
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
