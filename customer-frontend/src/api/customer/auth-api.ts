// Customer auth data layer — /api/countries plus the real Firebase + FastAPI
// authentication endpoints (see @backend/core/auth-service).

import type { AccountRole, AuthSession, RequestOtpResult } from "@/shared/types";

import {
  AUTH_ENDPOINTS,
  authMode,
  fetchCurrentUser,
  logout as logoutSession,
  refreshSession,
  restoreSession,
  sendPhoneOtp,
  signInWithApple,
  signInWithGoogle,
  verifyPhoneOtp,
} from "../core/auth-service";
import { apiGetJson } from "../core/transport";
import { setRememberSession } from "../core/session-store";
import { startSessionAutoRefresh } from "../core/session-refresh";


const ROLE: AccountRole = "customer";

export const AUTH_API_ENDPOINTS = {
  countries: "/api/countries",
  ...AUTH_ENDPOINTS,
} as const;

export type Country = {
  code: string;
  label: string;
  digits: number;
};

/** Offline-safe defaults so the login screen always has a dial code. */
export const DEFAULT_COUNTRIES: Country[] = [
  { code: "+91", label: "IN", digits: 10 },
  { code: "+971", label: "AE", digits: 9 },
  { code: "+44", label: "GB", digits: 10 },
  { code: "+1", label: "US", digits: 10 },
];

/**
 * GET /api/countries
 *
 * Never rejects: when the backend is unreachable the screen keeps working with
 * DEFAULT_COUNTRIES instead of surfacing a network error to the customer.
 */
export async function fetchCountries(): Promise<Country[]> {
  try {
    const list = await apiGetJson<Country[]>(AUTH_API_ENDPOINTS.countries);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_COUNTRIES;
  } catch {
    return DEFAULT_COUNTRIES;
  }
}

/** POST /api/auth/phone/send-otp */
export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  return sendPhoneOtp(phone, ROLE);
}

/** POST /api/auth/phone/verify — stores the JWT pair for every later call. */
export async function verifyOtp(phone: string, code: string, referralCode?: string): Promise<AuthSession> {
  return verifyPhoneOtp(phone, code, ROLE, referralCode);
}

/** POST /api/auth/google */
export async function loginWithGoogle(referralCode?: string): Promise<AuthSession> {
  return signInWithGoogle(ROLE, referralCode);
}

/** POST /api/auth/apple (prepared, disabled on Android builds) */
export async function loginWithApple(referralCode?: string): Promise<AuthSession> {
  return signInWithApple(ROLE, referralCode);
}

/** GET /api/auth/me */
export async function fetchAuthenticatedAccount() {
  return fetchCurrentUser();
}

/** Splash → session restore → Home or Auth. */
export async function restoreCustomerSession(): Promise<AuthSession | null> {
  return restoreSession(ROLE);
}

/** POST /api/auth/refresh */
export async function refreshCustomerSession(): Promise<AuthSession | null> {
  return refreshSession(ROLE);
}

/** POST /api/auth/logout */
export async function logout(): Promise<void> {
  return logoutSession(ROLE);
}

export { authMode };

/** "Remember me" — keeps the customer signed in across browser restarts. */
export function rememberCustomerLogin(remember: boolean): void {
  setRememberSession(remember, ROLE);
}

/** Keeps the access token ahead of expiry while the app is open. */
export function startCustomerAutoRefresh(): () => void {
  return startSessionAutoRefresh(ROLE);
}
