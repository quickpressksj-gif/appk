/** GET/POST/PUT/DELETE /api/admin/coupons and /api/admin/referrals */
import { apiGetJson, apiPostJson, apiPutJson } from "@/api/core/transport";

export type Coupon = {
  id: string;
  code: string;
  type: "Flat" | "Percentage" | "Cashback";
  value: string;
  minOrder: string;
  audience: string;
  used: number;
  expiry: string;
  status: "Active" | "Scheduled" | "Expired";
};

export type Offer = {
  id: string;
  name: string;
  kind: "Referral" | "Membership" | "Festival";
  reward: string;
  window: string;
  status: "Active" | "Draft" | "Ended";
};

export type ReferralProgramSettings = {
  id: string;
  enabled: boolean;
  refereeDiscountPercent: number;
  refereeMaxDiscount: number;
  refereeMinOrderValue: number;
  referrerRewardAmount: number;
  referrerRewardType: string;
  headline: string;
  subheadline: string;
  terms: string[];
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type AdminReferralItem = {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerPhone: string;
  refereeId: string;
  refereeName: string;
  refereePhone: string;
  code: string;
  status: "pending" | "completed" | "expired";
  rewardAmount: number;
  discountApplied: number;
  firstOrderId?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type AdminReferralStats = {
  totalInvites: number;
  totalRegisteredReferrals: number;
  convertedFirstOrders: number;
  totalDiscountGiven: number;
  totalRewardsPaid: number;
  activeSettings: ReferralProgramSettings;
};

export type AdminReferralListResponse = {
  items: AdminReferralItem[];
  total: number;
  stats: AdminReferralStats;
};

type BackendCoupon = {
  _id: string;
  code: string;
  discount: string;
  description: string;
  expiry: string;
  minOrder: number;
  status: string;
};

function toCoupon(row: BackendCoupon): Coupon {
  return {
    id: row._id,
    code: row.code,
    type: "Flat",
    value: row.discount,
    minOrder: `₹${(row.minOrder ?? 0).toLocaleString("en-IN")}`,
    audience: row.description || "All customers",
    used: 0,
    expiry: row.expiry || "—",
    status: (row.status as Coupon["status"]) ?? "Active",
  };
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const rows = await apiGetJson<BackendCoupon[]>("/api/admin/coupons");
  return rows.map(toCoupon);
}

export function createCoupon(payload: Record<string, string>) {
  return apiPostJson<BackendCoupon>("/api/admin/coupons", {
    code: payload["code"],
    discount: payload["value"],
    minOrder: Number(String(payload["minOrder"]).replace(/[^\d.]/g, "")) || 0,
    expiry: payload["expiry"],
  });
}

// -----------------------------------------------------------------------------
// Real Referral Engine API Clients
// -----------------------------------------------------------------------------

export async function fetchReferralSettings(): Promise<ReferralProgramSettings> {
  return apiGetJson<ReferralProgramSettings>("/api/admin/referrals/settings");
}

export async function updateReferralSettings(
  payload: Partial<ReferralProgramSettings>
): Promise<ReferralProgramSettings> {
  return apiPutJson<ReferralProgramSettings>("/api/admin/referrals/settings", payload);
}

export async function fetchReferralStats(): Promise<AdminReferralStats> {
  return apiGetJson<AdminReferralStats>("/api/admin/referrals/stats");
}

export async function fetchReferralsList(): Promise<AdminReferralListResponse> {
  return apiGetJson<AdminReferralListResponse>("/api/admin/referrals/list");
}

/** Legacy placeholder preserved for backward compat */
export async function fetchOffers(): Promise<Offer[]> {
  return [];
}

