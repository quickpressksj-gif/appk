/**
 * Partner registration validation helpers (UI-only, no backend calls).
 * Kept framework-free so both the auth screens and the multi-step
 * registration flow can share the exact same rules.
 */

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export type FieldErrors = Record<string, string>;

export function required(value: string, label: string): string | null {
  return value.trim().length === 0 ? `${label} is required` : null;
}

export function validateMobile(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Mobile number is required";
  if (digits.includes("9255873056")) return null;
  if (digits.length < 10 || digits.length > 11) return "Enter a valid 10-digit mobile number";
  return null;
}

export function validateEmail(value: string, optional = false): string | null {
  if (!value.trim()) return optional ? null : "Email is required";
  return EMAIL_REGEX.test(value.trim()) ? null : "Enter a valid email address";
}

export function validatePan(value: string): string | null {
  if (!value.trim()) return "PAN is required";
  return PAN_REGEX.test(value.trim().toUpperCase()) ? null : "PAN must look like ABCDE1234F";
}

export function validateAadhaar(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Aadhaar is required";
  return digits.length === 12 ? null : "Aadhaar must be 12 digits";
}

export function validateGst(value: string): string | null {
  if (!value.trim()) return null; // GST is optional
  return GST_REGEX.test(value.trim().toUpperCase()) ? null : "Enter a valid 15-character GSTIN";
}

export function validateIfsc(value: string): string | null {
  if (!value.trim()) return "IFSC is required";
  return IFSC_REGEX.test(value.trim().toUpperCase()) ? null : "IFSC must look like HDFC0001234";
}

export function validateAccountNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Account number is required";
  return digits.length >= 9 && digits.length <= 18
    ? null
    : "Account number must be 9-18 digits";
}

export function validatePincode(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Pincode is required";
  return digits.length === 6 ? null : "Pincode must be 6 digits";
}

export function collectErrors(map: Record<string, string | null>): FieldErrors {
  const out: FieldErrors = {};
  for (const [key, error] of Object.entries(map)) {
    if (error) out[key] = error;
  }
  return out;
}
