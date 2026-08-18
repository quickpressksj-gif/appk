/**
 * Sprint 5.6 — Partner earnings, wallet ledger, settlements and withdrawals.
 * Wraps `backend/src/payments/wallet-ledger-api.ts` with TanStack Query.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchPartnerEarnings,
  fetchPartnerSettlements,
  fetchPartnerWithdrawals,
  fetchWalletLedger,
  requestPartnerWithdrawal,
} from "@backend/payments/wallet-ledger-api";

export const partnerPaymentKeys = {
  earnings: ["partner", "earnings"] as const,
  ledger: ["partner", "wallet-ledger"] as const,
  settlements: ["partner", "settlements"] as const,
  withdrawals: ["partner", "withdrawals"] as const,
};

export function usePartnerEarnings() {
  return useQuery({ queryKey: partnerPaymentKeys.earnings, queryFn: fetchPartnerEarnings });
}

export function usePartnerLedger(limit = 50) {
  return useQuery({
    queryKey: [...partnerPaymentKeys.ledger, limit],
    queryFn: () => fetchWalletLedger({ limit }),
  });
}

export function usePartnerSettlements() {
  return useQuery({ queryKey: partnerPaymentKeys.settlements, queryFn: fetchPartnerSettlements });
}

export function usePartnerWithdrawals() {
  return useQuery({ queryKey: partnerPaymentKeys.withdrawals, queryFn: fetchPartnerWithdrawals });
}

export function useRequestPartnerWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; method: "bank" | "upi"; destination?: string }) =>
      requestPartnerWithdrawal(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partnerPaymentKeys.withdrawals });
      void queryClient.invalidateQueries({ queryKey: partnerPaymentKeys.ledger });
      void queryClient.invalidateQueries({ queryKey: partnerPaymentKeys.earnings });
    },
  });
}
