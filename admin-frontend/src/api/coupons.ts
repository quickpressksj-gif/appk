/** GET/POST/PUT/DELETE /api/admin/coupons — real coupons from the shared backend. Offers/referrals have no backend endpoint yet. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

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

/** No referral/offer endpoint exists on the backend yet. */
export async function fetchOffers(): Promise<Offer[]> {
  return [];
}

export function createCoupon(payload: Record<string, string>) {
  return apiPostJson<BackendCoupon>("/api/admin/coupons", {
    code: payload["code"],
    discount: payload["value"],
    minOrder: Number(String(payload["minOrder"]).replace(/[^\d.]/g, "")) || 0,
    expiry: payload["expiry"],
  });
}
