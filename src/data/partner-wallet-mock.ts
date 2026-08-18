/**
 * Sprint 3.6 — Partner Wallet & Earnings mock data (UI only).
 *
 * No backend, no Razorpay. Every value below is static demo data used to
 * exercise the wallet UI states (loading, populated, empty).
 * Future backend integration points are marked with `TODO(api)`.
 */

export type WalletRangeId = "today" | "week" | "month" | "custom";

export type TransactionKind = "credit" | "debit" | "refund" | "adjustment" | "settlement";

export type TransactionStatus = "success" | "pending" | "failed";

export type WalletTransaction = {
  id: string;
  title: string;
  kind: TransactionKind;
  amount: number;
  status: TransactionStatus;
  date: string;
  reference: string;
  method: string;
};

export type SettlementRecord = {
  id: string;
  amount: number;
  status: "settled" | "processing" | "failed";
  date: string;
  utr: string;
};

export type BankAccount = {
  holder: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
};

export type WalletSummary = {
  balance: number;
  today: number;
  week: number;
  month: number;
  pendingSettlement: number;
  lifetime: number;
  minWithdraw: number;
  settlementEta: string;
};

export type EarningsAnalytics = {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  avgOrderValue: number;
  totalOrders: number;
  completedOrders: number;
  trend: { label: string; amount: number }[];
};

export type PartnerWalletData = {
  summary: WalletSummary;
  analytics: EarningsAnalytics;
  transactions: WalletTransaction[];
  settlements: SettlementRecord[];
  bankAccount: BankAccount;
};

export const WALLET_RANGES: { id: WalletRangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Date" },
];

export const TRANSACTION_FILTERS: { id: "all" | TransactionKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "credit", label: "Credits" },
  { id: "debit", label: "Debits" },
  { id: "refund", label: "Refunds" },
  { id: "adjustment", label: "Adjustments" },
  { id: "settlement", label: "Settlements" },
];

const summary: WalletSummary = {
  balance: 18450,
  today: 2340,
  week: 14860,
  month: 58420,
  pendingSettlement: 6120,
  lifetime: 486300,
  minWithdraw: 500,
  settlementEta: "24–48 working hours",
};

const analytics: EarningsAnalytics = {
  todayRevenue: 2340,
  weekRevenue: 14860,
  monthRevenue: 58420,
  avgOrderValue: 428,
  totalOrders: 137,
  completedOrders: 129,
  trend: [
    { label: "Mon", amount: 1880 },
    { label: "Tue", amount: 2260 },
    { label: "Wed", amount: 1540 },
    { label: "Thu", amount: 2680 },
    { label: "Fri", amount: 2120 },
    { label: "Sat", amount: 2040 },
    { label: "Sun", amount: 2340 },
  ],
};

const transactions: WalletTransaction[] = [
  {
    id: "TXN-90811",
    title: "Order payout · #QP1421",
    kind: "credit",
    amount: 640,
    status: "success",
    date: "06 Aug 2026, 04:12 PM",
    reference: "REF-QP1421-90811",
    method: "UPI",
  },
  {
    id: "TXN-90808",
    title: "Order payout · #QP1418",
    kind: "credit",
    amount: 480,
    status: "success",
    date: "06 Aug 2026, 01:35 PM",
    reference: "REF-QP1418-90808",
    method: "UPI",
  },
  {
    id: "TXN-90802",
    title: "Platform commission",
    kind: "debit",
    amount: 96,
    status: "success",
    date: "06 Aug 2026, 01:36 PM",
    reference: "REF-COM-90802",
    method: "Wallet",
  },
  {
    id: "TXN-90795",
    title: "Customer refund · #QP1409",
    kind: "refund",
    amount: 220,
    status: "pending",
    date: "05 Aug 2026, 07:48 PM",
    reference: "REF-RFD-90795",
    method: "Net Banking",
  },
  {
    id: "TXN-90788",
    title: "Weight correction adjustment",
    kind: "adjustment",
    amount: 60,
    status: "success",
    date: "05 Aug 2026, 11:02 AM",
    reference: "REF-ADJ-90788",
    method: "Wallet",
  },
  {
    id: "TXN-90770",
    title: "Weekly settlement to bank",
    kind: "settlement",
    amount: 12480,
    status: "success",
    date: "02 Aug 2026, 10:15 AM",
    reference: "REF-STL-90770",
    method: "IMPS",
  },
  {
    id: "TXN-90764",
    title: "Failed settlement retry",
    kind: "settlement",
    amount: 3260,
    status: "failed",
    date: "01 Aug 2026, 09:20 AM",
    reference: "REF-STL-90764",
    method: "NEFT",
  },
];

const settlements: SettlementRecord[] = [
  {
    id: "STL-4821",
    amount: 12480,
    status: "settled",
    date: "02 Aug 2026",
    utr: "UTR3948201847",
  },
  {
    id: "STL-4790",
    amount: 9860,
    status: "settled",
    date: "26 Jul 2026",
    utr: "UTR3948190233",
  },
  {
    id: "STL-4762",
    amount: 6120,
    status: "processing",
    date: "19 Jul 2026",
    utr: "Awaiting UTR",
  },
  {
    id: "STL-4744",
    amount: 3260,
    status: "failed",
    date: "12 Jul 2026",
    utr: "UTR3948113900",
  },
];

export const bankAccount: BankAccount = {
  holder: "Ramesh Kumar",
  bankName: "HDFC Bank · Koramangala",
  accountNumber: "50100294417832",
  ifsc: "HDFC0001234",
};

export const partnerWalletMock: PartnerWalletData = {
  summary,
  analytics,
  transactions,
  settlements,
  bankAccount,
};

/** Empty-state variant used to preview "no earnings yet" partners. */
export const partnerWalletEmptyMock: PartnerWalletData = {
  summary: {
    balance: 0,
    today: 0,
    week: 0,
    month: 0,
    pendingSettlement: 0,
    lifetime: 0,
    minWithdraw: 500,
    settlementEta: "24–48 working hours",
  },
  analytics: {
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    completedOrders: 0,
    trend: [],
  },
  transactions: [],
  settlements: [],
  bankAccount,
};

/** TODO(api): replace with GET /api/partner/wallet + /api/partner/earnings. */
export async function fetchPartnerWalletData(): Promise<PartnerWalletData> {
  await new Promise((resolve) => setTimeout(resolve, 650));
  return partnerWalletMock;
}

export function maskAccountNumber(accountNumber: string) {
  const last4 = accountNumber.slice(-4);
  return `•••• •••• ${last4}`;
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function rangeAmount(summary: WalletSummary, range: WalletRangeId) {
  if (range === "today") return summary.today;
  if (range === "week") return summary.week;
  return summary.month;
}
