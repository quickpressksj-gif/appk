/**
 * Rider onboarding validation helpers — UI only, no backend calls.
 * Every validator returns an error string or `null` when the value is valid.
 */

const PATTERNS = {
  mobile: /^[6-9]\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i,
  pincode: /^[1-9]\d{5}$/,
  aadhaar: /^\d{12}$/,
  pan: /^[A-Z]{5}\d{4}[A-Z]$/,
  license: /^[A-Z]{2}[ -]?\d{2}[ -]?\d{4}\d{7}$|^[A-Z]{2}\d{13}$/,
  vehicle: /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{1,4}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  account: /^\d{9,18}$/,
};

export function required(value: string, label = "This field"): string | null {
  return value.trim().length ? null : `${label} is required`;
}

export function validateName(value: string): string | null {
  if (!value.trim()) return "Full name is required";
  if (value.trim().length < 3) return "Enter your full name";
  return null;
}

export function validateMobile(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  if (!last10) return "Mobile number is required";
  return PATTERNS.mobile.test(last10) ? null : "Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)";
}

export function validateEmail(value: string, optional = false): string | null {
  if (!value) return optional ? null : "Email is required";
  return PATTERNS.email.test(value) ? null : "Enter a valid email address";
}

export function validateDob(value: string): string | null {
  if (!value) return "Date of birth is required";
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return "Enter a valid date";
  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 18) return "You must be at least 18 years old";
  if (age > 70) return "Enter a valid date of birth";
  return null;
}

export function validatePincode(value: string): string | null {
  if (!value) return "PIN code is required";
  return PATTERNS.pincode.test(value) ? null : "Enter a valid 6-digit PIN code";
}

export function validateAadhaar(value: string): string | null {
  const digits = value.replace(/\s/g, "");
  if (!digits) return "Aadhaar number is required";
  return PATTERNS.aadhaar.test(digits) ? null : "Aadhaar must be 12 digits";
}

export function validatePan(value: string): string | null {
  if (!value) return "PAN number is required";
  return PATTERNS.pan.test(value.toUpperCase()) ? null : "PAN format should be ABCDE1234F";
}

export function validateLicense(value: string): string | null {
  const clean = value.replace(/[\s-]/g, "").toUpperCase();
  if (!clean) return "Driving license number is required";
  return PATTERNS.license.test(clean) ? null : "Enter a valid 15-character license number";
}

export function validateVehicleNumber(value: string): string | null {
  if (!value) return "Vehicle number is required";
  return PATTERNS.vehicle.test(value.toUpperCase().trim())
    ? null
    : "Format should be MH 02 CX 4821";
}

export function validateIfsc(value: string): string | null {
  if (!value) return "IFSC code is required";
  return PATTERNS.ifsc.test(value.toUpperCase()) ? null : "IFSC format should be HDFC0000241";
}

export function validateAccountNumber(value: string): string | null {
  if (!value) return "Account number is required";
  return PATTERNS.account.test(value) ? null : "Account number must be 9–18 digits";
}

export function validateOtp(value: string): string | null {
  return value.length === 6 ? null : "Enter the 6-digit code";
}

/** Removes empty errors so a step is valid when the map has no entries. */
export function compact(errors: Record<string, string | null>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value) out[key] = value;
  }
  return out;
}
