/**
 * QuickPress Partner Finance, Payout & Settlement API Client.
 */

import { apiGetJson, apiPostJson } from "../core/transport";

export type SettlementCycle = {
  cycleId: string;
  title?: string;
  period: string;
  startDate?: string;
  endDate?: string;
  payoutDate: string;
  status: "PAID" | "PROCESSING" | "ON HOLD" | "FAILED";
  isCurrent?: boolean;
};

export type FinanceOverviewResponse = {
  currentCycle: {
    cycleId: string;
    period: string;
    payoutDate: string;
    estPayout: number;
    orderCount: number;
    status: string;
  };
  pastCycles: {
    cycleId: string;
    period: string;
    payoutDate: string;
    status: string;
    netPayout: number;
    orderCount: number;
  }[];
  filterOptions: string[];
};

export type SettlementOrder = {
  orderId: string;
  orderCode: string;
  date: string;
  itemsSummary: string;
  customerName: string;
  grossValue: number;
  commission: number;
  netEarning: number;
  status: string;
};

export type SettlementExpense = {
  title: string;
  category: string;
  amount: number;
  date: string;
};

export type SettlementBreakdown = {
  partnerId: string;
  businessName: string;
  ownerName: string;
  city: string;
  cycle: SettlementCycle;
  totalOrders: number;
  estNetPayout: number;
  netOrderValueA: {
    total: number;
    itemSubtotal: number;
    totalGstCollected: number;
    restaurantDiscountPromos: number;
    restaurantDiscountFlat: number;
  };
  additionsB: {
    total: number;
    tds194h: number;
    tds194c: number;
    targetIncentiveBonus: number;
    qualityRatingBonus: number;
  };
  orderLevelDeductionsC: {
    total: number;
    platformCommission: number;
    commissionRatePct: number;
    damagePenalty: number;
    cancellationFee: number;
  };
  taxDeductionsD: {
    total: number;
    gstOnServiceFees18: number;
    tds194o: number;
    tcsGst: number;
  };
  investmentsInGrowthE: {
    total: number;
    onlineOrderingAds: number;
  };
  suppliesSpendF: {
    total: number;
    packagingAndTags: number;
  };
  orders: SettlementOrder[];
  expenses: SettlementExpense[];
  bankDetails: {
    accountHolder: string;
    bankName: string;
    accountNumberMasked: string;
    ifsc: string;
    utr?: string | null;
    creditedAt?: string | null;
    transferMode: string;
  };
};

export type TaxInvoice = {
  invoiceNumber: string;
  period: string;
  date: string;
  type: string;
  amount: number;
  gstAmount: number;
  status: string;
};

export async function fetchFinanceOverview(): Promise<FinanceOverviewResponse> {
  return apiGetJson<FinanceOverviewResponse>("/api/partner/finance/overview");
}

export async function fetchSettlementBreakdown(cycleId: string): Promise<SettlementBreakdown> {
  return apiGetJson<SettlementBreakdown>(`/api/partner/finance/settlement/${cycleId}`);
}

export async function downloadSettlementReport(cycleId: string): Promise<{ ok: boolean; filename: string; data: SettlementBreakdown }> {
  return apiGetJson<{ ok: boolean; filename: string; data: SettlementBreakdown }>(`/api/partner/finance/statement/${cycleId}/download`);
}

export async function emailSettlementReport(cycleId: string): Promise<{ ok: boolean; message: string }> {
  return apiPostJson<{ ok: boolean; message: string }>(`/api/partner/finance/statement/${cycleId}/email`, {});
}

export async function fetchFinanceTaxInvoices(): Promise<{ invoices: TaxInvoice[] }> {
  return apiGetJson<{ invoices: TaxInvoice[] }>("/api/partner/finance/invoices");
}
