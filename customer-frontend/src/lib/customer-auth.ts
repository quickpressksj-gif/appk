/**
 * Customer login adapter (frontend-local).
 *
 * Wraps the existing `@backend/customer/auth-api` phone flow with the test-OTP
 * path. The accepted test code is never present in this bundle: the browser
 * only learns *whether* the code it typed was accepted, from the server
 * function in `customer-otp.functions.ts`.
 *
 * The real provider flow (Firebase Phone Auth → FastAPI JWT pair) stays the
 * primary path and is always tried first; the test path only runs when the
 * server says test mode is enabled.
 */

import { verifyOtp as verifyRealOtp } from "@/api/customer/auth-api";
import { UNIVERSAL_OTP } from "@/api/mock/auth-core";
import type { AuthSession } from "@/shared/types";

import { verifyTestOtp } from "./customer-otp.functions";

export async function verifyCustomerOtp(phone: string, code: string): Promise<AuthSession> {
  try {
    return await verifyRealOtp(phone, code);
  } catch (cause) {
    const test = await verifyTestOtp({ data: { phone, otp: code } }).catch(() => null);
    if (!test?.ok) throw cause;
    // Test mode accepted the code — complete the normal session exchange so the
    // JWT pair, account row and every later API call behave identically.
    return verifyRealOtp(phone, UNIVERSAL_OTP);
  }
}
