/** GET/PUT /api/admin/settings — real platform settings document from the shared backend. */
import { apiGetJson } from "@/api/core/transport";
import { request } from "@/api/core/admin-client";

export type PlatformSettings = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCity: string;
  currency: string;
};

export type BusinessSettings = {
  legalName: string;
  gstin: string;
  address: string;
  payoutCycle: string;
};

export type IntegrationSettings = {
  paymentGateway: string;
  paymentKeyId: string;
  firebaseProject: string;
  googleMapsKey: string;
  smtpHost: string;
  smtpUser: string;
  smsProvider: string;
  smsSenderId: string;
};

export type FinanceSettings = {
  gstPercent: string;
  serviceTax: string;
  defaultCommission: string;
  riderCommission: string;
};

export type AdminSettings = {
  platform: PlatformSettings;
  business: BusinessSettings;
  integrations: IntegrationSettings;
  finance: FinanceSettings;
};

const DEFAULTS: AdminSettings = {
  platform: { platformName: "QuickPress", supportEmail: "", supportPhone: "", defaultCity: "", currency: "INR (₹)" },
  business: { legalName: "", gstin: "", address: "", payoutCycle: "" },
  integrations: {
    paymentGateway: "",
    paymentKeyId: "",
    firebaseProject: "",
    googleMapsKey: "",
    smtpHost: "",
    smtpUser: "",
    smsProvider: "",
    smsSenderId: "",
  },
  finance: { gstPercent: "", serviceTax: "", defaultCommission: "", riderCommission: "" },
};

/** GET /api/admin/settings — the document is a flat, free-form bag; fold it into the console's grouped view. */
export async function fetchSettings(): Promise<AdminSettings> {
  const doc = await apiGetJson<Record<string, unknown>>("/api/admin/settings");
  const merged = structuredClone(DEFAULTS);
  for (const group of Object.keys(merged) as (keyof AdminSettings)[]) {
    const groupDoc = doc[group] as Record<string, string> | undefined;
    if (groupDoc) Object.assign(merged[group], groupDoc);
  }
  return merged;
}

/** PUT /api/admin/settings */
export async function saveSettings(settings: AdminSettings): Promise<AdminSettings> {
  return request<AdminSettings>("/settings", { method: "PUT", body: JSON.stringify(settings) });
}

export type SecurityEvent = {
  _id?: string;
  eventType: string;
  clientIp: string;
  userAgent?: string;
  failedCount?: number;
  lockedUntil?: number | null;
  adminId?: string;
  timestamp: string;
};

export type ActiveLockout = {
  _id: string;
  ip: string;
  failedCount: number;
  lockedUntil: number;
  lastAttemptAt: string;
};

export type SecurityEventsResponse = {
  ok: boolean;
  events: SecurityEvent[];
  activeLockouts: ActiveLockout[];
};

export async function fetchSecurityEvents(): Promise<SecurityEventsResponse> {
  return apiGetJson<SecurityEventsResponse>("/api/admin/security/events");
}

export async function unlockClientIp(ip: string): Promise<{ ok: boolean; message: string }> {
  return request<{ ok: boolean; message: string }>("/security/unlock-ip", {
    method: "POST",
    body: JSON.stringify({ ip }),
  });
}

export async function changeAdminPin(currentPin: string, newPin: string): Promise<{ ok: boolean; message: string }> {
  return request<{ ok: boolean; message: string }>("/security/change-pin", {
    method: "POST",
    body: JSON.stringify({ currentPin, newPin }),
  });
}

