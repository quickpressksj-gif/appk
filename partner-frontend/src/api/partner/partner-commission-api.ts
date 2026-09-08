/**
 * QuickPress Partner Real-Time Commission Engine API.
 * Integrated with backend & Supabase PostgreSQL.
 */

import { apiGetJson } from "../core/transport";

export type PartnerCommissionTier = {
  partnerId: string;
  monthlyOrders: number;
  tier: "Standard" | "Silver" | "Gold";
  commissionRate: number;
  commissionRatePct: number;
  nextTier: string | null;
  ordersNeededForNextTier: number;
  progressPct: number;
  badgeColor: string;
  benefits: string[];
  financialSummary: {
    totalSubtotal: number;
    totalCommissionPaid: number;
    totalTcsDeducted: number;
    totalNetCredited: number;
    totalCommissionSaved: number;
  };
  tcsRatePct: number;
  tcsSection: string;
};

export type PartnerOrderCommissionSlip = {
  orderId: string;
  orderCode: string;
  partnerId: string;
  tier: string;
  commissionRatePct: number;
  itemsGrossSubtotal: number;
  platformCommissionAmount: number;
  gstOnCommission18: number;
  tcsDeduction1Pct: number;
  netStoreEarning: number;
  settlementStatus: "SETTLED" | "PENDING_DELIVERY";
  calculatedAt: string;
};

export async function fetchPartnerCommissionTier(): Promise<PartnerCommissionTier> {
  return apiGetJson<PartnerCommissionTier>("/api/partner/commission/tier");
}

export async function fetchPartnerOrderCommissionSlip(
  orderId: string
): Promise<PartnerOrderCommissionSlip> {
  return apiGetJson<PartnerOrderCommissionSlip>(
    `/api/partner/commission/orders/${orderId}`
  );
}

export async function fetchPartnerCommissionSummary(): Promise<{
  profile: PartnerCommissionTier;
  recentSettlements: any[];
}> {
  return apiGetJson<{
    profile: PartnerCommissionTier;
    recentSettlements: any[];
  }>("/api/partner/commission/summary");
}
