/**
 * Customer test-mode OTP verification (customer-local adapter).
 *
 * The accepted OTP lives ONLY in the server environment (CUSTOMER_TEST_OTP) and
 * is compared inside the handler, so it never reaches the client bundle, the
 * console, the network response or any log line.
 *
 * It is honoured only while CUSTOMER_AUTH_MODE is "test" or "development".
 * In production the handler refuses, and the real provider OTP flow
 * (Firebase Phone Auth via @backend/core/auth-service) is the only way in.
 */

import { createServerFn } from "@tanstack/react-start";

type TestOtpInput = { phone: string; otp: string };

function parseInput(data: unknown): TestOtpInput {
  const value = data as Partial<TestOtpInput> | null;
  const phone = typeof value?.phone === "string" ? value.phone.trim() : "";
  const otp = typeof value?.otp === "string" ? value.otp.trim() : "";
  if (phone.length < 6 || phone.length > 20) throw new Error("Invalid phone number");
  if (otp.length < 4 || otp.length > 10) throw new Error("Invalid code");
  return { phone, otp };
}

function testModeEnabled(mode: string): boolean {
  return mode === "test" || mode === "development";
}

/** Never returns the expected value — only whether the supplied one matched. */
export const verifyTestOtp = createServerFn({ method: "POST" })
  .inputValidator(parseInput)
  .handler(async ({ data }) => {
    const mode = process.env["CUSTOMER_AUTH_MODE"] ?? "production";
    if (!testModeEnabled(mode)) return { ok: false as const, reason: "test_mode_disabled" as const };

    const expected = process.env["CUSTOMER_TEST_OTP"];
    if (!expected) return { ok: false as const, reason: "test_otp_not_configured" as const };

    // Length-independent comparison over SHA-256 digests.
    const encoder = new TextEncoder();
    const [a, b] = await Promise.all([
      crypto.subtle.digest("SHA-256", encoder.encode(data.otp)),
      crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    ]);
    const x = new Uint8Array(a);
    const y = new Uint8Array(b);
    let diff = 0;
    for (let i = 0; i < x.length; i += 1) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
    if (diff !== 0) return { ok: false as const, reason: "invalid_otp" as const };

    return { ok: true as const };
  });

/** Lets the UI know whether test-mode phone login is available at all. */
export const getPhoneAuthMode = createServerFn({ method: "GET" }).handler(async () => {
  const mode = process.env["CUSTOMER_AUTH_MODE"] ?? "production";
  return {
    mode,
    testOtpEnabled: testModeEnabled(mode) && Boolean(process.env["CUSTOMER_TEST_OTP"]),
  };
});
