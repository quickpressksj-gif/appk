import { apiDeleteJson, apiGetJson, apiPostJson, apiPutJson } from "@/api/core/transport";

export interface MembershipBenefit {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  plans?: string[];
}

export interface MembershipPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavings: number;
  savingsLabel: string;
  validityDays: number;
  yearlyValidityDays: number;
  popular: boolean;
  status: "Active" | "Inactive" | "Archived";
  badge: string;
  color: string;
  order: number;
  discountPercent: number;
  freeDeliveryMinOrder: number;
  freePickup: boolean;
  priorityProcessing: boolean;
  supportTier: string;
  benefits: MembershipBenefit[];
}

export interface AdminPlanPayload {
  id?: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  validityDays: number;
  yearlyValidityDays: number;
  popular: boolean;
  status: "Active" | "Inactive";
  badge: string;
  color: string;
  order: number;
  discountPercent: number;
  freeDeliveryMinOrder: number;
  freePickup: boolean;
  priorityProcessing: boolean;
  supportTier: string;
  benefits: MembershipBenefit[];
}

export interface MembershipSubscriberItem {
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: string;
  billingCycle: string;
  amountPaid: number;
  startedAt?: string;
  expiresAt?: string;
  autoRenew: boolean;
  remainingDays: number;
}

export interface MembershipSubscribersResponse {
  items: MembershipSubscriberItem[];
  total: number;
}

export interface MembershipStatsResponse {
  totalSubscribers: number;
  activeMembers: number;
  monthlyRecurringRevenue: number;
  annualRunRate: number;
  topPlanName: string;
  expiringSoonCount: number;
  tierBreakdown: Record<string, number>;
}

export interface MembershipTransaction {
  id: string;
  planId: string;
  planName: string;
  type: string;
  billingCycle: string;
  amount: number;
  paymentStatus: string;
  paymentReference?: string;
  subscribedAt: string;
  renewalAt?: string;
  expiresAt?: string;
}

export interface MembershipTransactionsResponse {
  items: MembershipTransaction[];
  total: number;
}

export interface AdminGrantPayload {
  planId: string;
  billingCycle?: "monthly" | "yearly";
  validityDays?: number;
  reason?: string;
}

// ------------------------------------------------------------------ API Calls

export async function fetchMembershipStats(): Promise<MembershipStatsResponse> {
  return apiGetJson<MembershipStatsResponse>("/api/admin/memberships/stats");
}

export async function fetchAdminMembershipPlans(includeInactive = true): Promise<MembershipPlan[]> {
  return apiGetJson<MembershipPlan[]>(`/api/admin/memberships/plans?include_inactive=${includeInactive}`);
}

export async function createMembershipPlan(payload: AdminPlanPayload): Promise<MembershipPlan> {
  return apiPostJson<MembershipPlan>("/api/admin/memberships/plans", payload);
}

export async function updateMembershipPlan(planId: string, payload: AdminPlanPayload): Promise<MembershipPlan> {
  return apiPutJson<MembershipPlan>(`/api/admin/memberships/plans/${planId}`, payload);
}

export async function deleteMembershipPlan(planId: string): Promise<{ ok: boolean; message: string }> {
  return apiDeleteJson<{ ok: boolean; message: string }>(`/api/admin/memberships/plans/${planId}`);
}

export async function fetchMembershipSubscribers(params?: {
  q?: string;
  status?: string;
  planId?: string;
  limit?: number;
  offset?: number;
}): Promise<MembershipSubscribersResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.status) query.set("status", params.status);
  if (params?.planId) query.set("plan_id", params.planId);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  return apiGetJson<MembershipSubscribersResponse>(`/api/admin/memberships/subscribers?${query.toString()}`);
}

export async function grantCustomerMembership(
  userId: string,
  payload: AdminGrantPayload
): Promise<MembershipSubscriberItem> {
  return apiPostJson<MembershipSubscriberItem>(`/api/admin/memberships/subscribers/${userId}/grant`, payload);
}

export async function revokeCustomerMembership(
  userId: string,
  reason?: string
): Promise<{ ok: boolean; message: string }> {
  return apiPostJson<{ ok: boolean; message: string }>(`/api/admin/memberships/subscribers/${userId}/revoke`, { reason });
}

export async function fetchMembershipTransactions(params?: {
  limit?: number;
  offset?: number;
}): Promise<MembershipTransactionsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  return apiGetJson<MembershipTransactionsResponse>(`/api/admin/memberships/transactions?${query.toString()}`);
}
