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

export async function sendPartnerAadhaarOtp(aadhaarNumber: string) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    clientId: string;
    aadhaar: string;
    maskedAadhaar: string;
    otpSent: boolean;
    source: string;
    message: string;
  }>("/api/partner/verify/aadhaar/send-otp", { aadhaarNumber });
}

export async function verifyPartnerAadhaarOtp(
  aadhaarNumber: string,
  otp: string,
  clientId?: string,
  fullName = ""
) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    aadhaar: string;
    maskedAadhaar: string;
    fullName?: string;
    gender?: string;
    dob?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    photo?: string;
    verificationStatus: string;
    source?: string;
    message: string;
  }>("/api/partner/verify/aadhaar/verify-otp", { aadhaarNumber, otp, clientId, fullName });
}

export async function verifyPartnerPan(panNumber: string, ownerName = "") {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    pan: string;
    fullName?: string;
    category: string;
    status?: string;
    aadhaarLinked?: boolean;
    verificationStatus: string;
    source?: string;
    message: string;
  }>("/api/partner/verify/pan", { panNumber, ownerName });
}

export async function verifyPartnerGst(gstin: string, shopName = "", ownerName = "") {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    gstin: string;
    tradeName?: string;
    legalName?: string;
    status?: string;
    taxpayerType?: string;
    state?: string;
    verificationStatus: string;
    source?: string;
    message: string;
  }>("/api/partner/verify/gst", { gstin, shopName, ownerName });
}

export async function verifyPartnerIfsc(ifsc: string) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    ifsc: string;
    bankName: string;
    branch: string;
    city: string;
    state: string;
    verificationStatus: string;
    source?: string;
    message: string;
  }>("/api/partner/verify/ifsc", { ifsc });
}

export async function verifyPartnerBankAccount(
  accountNumber: string,
  ifsc: string,
  accountHolder = ""
) {
  return apiPostJson<{
    ok: boolean;
    valid: boolean;
    accountNumber: string;
    ifsc: string;
    registeredName: string;
    pennyDropStatus: string;
    utrNumber?: string;
    verificationStatus: string;
    source?: string;
    message: string;
  }>("/api/partner/verify/bank", { accountNumber, ifsc, accountHolder });
}

