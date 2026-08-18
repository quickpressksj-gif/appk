/** Sprint 5.6 — Rider earnings, wallet ledger, incentives, settlements, withdrawals. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchRiderEarnings,
  fetchRiderIncentives,
  fetchRiderSettlements,
  fetchRiderWithdrawals,
  fetchWalletLedger,
  requestRiderWithdrawal,
} from "@/api/payments/wallet-ledger-api";

export const riderPaymentKeys = {
  earnings: ["rider", "earnings"] as const,
  ledger: ["rider", "wallet-ledger"] as const,
  incentives: ["rider", "incentives"] as const,
  settlements: ["rider", "settlements"] as const,
  withdrawals: ["rider", "withdrawals"] as const,
};

export function useRiderEarnings() {
  return useQuery({ queryKey: riderPaymentKeys.earnings, queryFn: fetchRiderEarnings });
}

export function useRiderLedger(limit = 50) {
  return useQuery({
    queryKey: [...riderPaymentKeys.ledger, limit],
    queryFn: () => fetchWalletLedger({ limit }),
  });
}

export function useRiderIncentives() {
  return useQuery({ queryKey: riderPaymentKeys.incentives, queryFn: fetchRiderIncentives });
}

export function useRiderSettlements() {
  return useQuery({ queryKey: riderPaymentKeys.settlements, queryFn: fetchRiderSettlements });
}

export function useRiderWithdrawals() {
  return useQuery({ queryKey: riderPaymentKeys.withdrawals, queryFn: fetchRiderWithdrawals });
}

export function useRequestRiderWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; method: "bank" | "upi"; destination?: string }) =>
      requestRiderWithdrawal(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: riderPaymentKeys.withdrawals });
      void queryClient.invalidateQueries({ queryKey: riderPaymentKeys.ledger });
      void queryClient.invalidateQueries({ queryKey: riderPaymentKeys.earnings });
    },
  });
}
