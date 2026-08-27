/**
 * Customer login adapter.
 *
 * Real provider flow: Phone verification with FastAPI JWT session issuance.
 */

import { verifyOtp as verifyRealOtp } from "@/api/customer/auth-api";
import type { AuthSession } from "@/shared/types";

export async function verifyCustomerOtp(
  phone: string,
  code: string,
  referralCode?: string,
): Promise<AuthSession> {
  return await verifyRealOtp(phone, code, referralCode);
}

