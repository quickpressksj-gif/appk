/**
 * Mock authentication.
 *
 * Mirrors a FastAPI OTP flow: request-otp → verify-otp → bearer token, plus a
 * password login used by the admin console. Tokens are opaque strings stored in
 * the mock DB; the transport sends them as `Authorization: Bearer …` exactly as
 * it will with the real backend.
 */

import type { Account, AccountRole, AuthSession, RequestOtpResult } from "@/shared/types";

import { ApiError } from "../core/errors";
import { activeSessionRole } from "../core/session-store";
import { getDb, mutateDb } from "./db";

const OTP_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 12 * 60 * 60_000;
/** Universal test OTP so any dummy phone number can sign in. */
export const UNIVERSAL_OTP = "123456";

function otpKey(phone: string, role: AccountRole): string {
  return `${role}:${phone}`;
}

function issueSession(account: Account): AuthSession {
  return mutateDb((db) => {
    const token = `mock.${account.role}.${account.id}.${Date.now().toString(36)}`;
    const session: AuthSession = {
      token,
      refreshToken: `${token}.refresh`,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      account,
    };
    db.sessions[token] = session;
    return session;
  });
}

export function requestOtp(phone: string, role: AccountRole): RequestOtpResult {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    throw new ApiError("validation", "Enter a valid 10-digit mobile number", 422);
  }

  const existing = getDb().accounts.find(
    (account) => account.role === role && account.phone === digits,
  );

  mutateDb((db) => {
    db.otps[otpKey(digits, role)] = {
      code: UNIVERSAL_OTP,
      expiresAt: Date.now() + OTP_TTL_MS,
      role,
    };
  });

  return {
    ok: true,
    devOtp: UNIVERSAL_OTP,
    expiresInSeconds: OTP_TTL_MS / 1000,
    isNewAccount: !existing,
  };
}

export function verifyOtp(phone: string, code: string, role: AccountRole): AuthSession {
  const digits = phone.replace(/\D/g, "").slice(-10);
  const record = getDb().otps[otpKey(digits, role)];

  if (!record || record.expiresAt < Date.now()) {
    throw new ApiError("validation", "That code expired. Request a new one.", 422);
  }
  if (code.replace(/\D/g, "") !== record.code) {
    throw new ApiError("validation", "Incorrect OTP. Please try again.", 422);
  }

  const account = mutateDb((db) => {
    const found = db.accounts.find((item) => item.role === role && item.phone === digits);
    if (found) return found;

    // New dummy account, created on first verified login.
    const created: Account = {
      id: `${role.slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      role,
      name: role === "customer" ? "QuickPress User" : "New QuickPress Partner",
      phone: digits,
      email: `${digits}@quickpress.test`,
      city: "Bengaluru",
      avatarInitials: "QP",
      isOnboarded: role === "customer" || role === "admin",
      isVerified: true,
    };
    db.accounts.push(created);
    return created;
  });

  return issueSession(account);
}

export function loginWithPassword(email: string, password: string, role: AccountRole): AuthSession {
  if (!email.trim() || password.length < 4) {
    throw new ApiError("validation", "Enter your email and password", 422);
  }
  const account = getDb().accounts.find(
    (item) => item.role === role && item.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!account) {
    throw new ApiError("unauthorized", "No account matches those credentials", 401);
  }
  return issueSession(account);
}

/** Resolve the account behind a bearer token. */
export function accountForToken(token: string | null): Account | null {
  if (!token) return null;
  const session = getDb().sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  return session.account;
}

export function requireAccount(token: string | null, role?: AccountRole): Account {
  const wanted = role ?? (activeSessionRole() as AccountRole);
  const account = accountForToken(token) ?? demoFallbackAccount(wanted);
  if (!account) throw new ApiError("unauthorized", "Sign in to continue", 401);
  if (role && account.role !== role) {
    throw new ApiError("unauthorized", "This account cannot access that area", 401);
  }
  return account;
}

/**
 * Testing convenience: while mocking, an app that has not signed in still gets
 * the first seeded account for its role so every screen is explorable. With the
 * real backend this never runs — the HTTP transport returns 401 instead.
 */
function demoFallbackAccount(role: AccountRole): Account | null {
  return getDb().accounts.find((account) => account.role === role) ?? null;
}

export function logout(token: string | null): { ok: true } {
  if (token) {
    mutateDb((db) => {
      delete db.sessions[token];
    });
  }
  return { ok: true };
}

/** Dummy credentials surfaced on the sign-in screens while mocking. */
export function demoAccounts(role: AccountRole): Account[] {
  return getDb().accounts.filter((account) => account.role === role);
}