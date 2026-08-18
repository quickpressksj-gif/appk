import { Landmark, ShieldCheck } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { BankDetailsCard } from "../../components/wallet/BankDetailsCard";
import { SummaryRow, WalletPanel } from "../../components/wallet/WalletPrimitives";
import { WalletHomeSkeleton } from "../../components/wallet/WalletSkeletons";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { loadWalletData } from "../../data/rider-wallet-adapter";

/**
 * Bank Details Screen — read-only view of the payout account that the backend
 * actually stores on the rider profile (bank name, masked account, IFSC).
 *
 * MISSING BACKEND ENDPOINT: there is no bank-details update endpoint, so the
 * edit-and-save flow is intentionally absent rather than faked. Settlement
 * schedule fields have no backend source and read "Not available".
 */
export function BankDetailsScreen() {
  const { data, isLoading } = useRiderResource(loadWalletData);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Bank Details"
          subtitle="Where your payouts are settled"
          action={<RiderBellAction count={0} />}
        />

        {isLoading || !data ? (
          <WalletHomeSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4">
            <BankDetailsCard bank={data.bank} />

            <section className="mt-6">
              <SectionHeading title="Settlement Info" />
              <WalletPanel className="mt-3">
                <SummaryRow
                  icon={Landmark}
                  label="Last settlement"
                  value={data.summary.lastSettlementOn}
                />
                <SummaryRow
                  icon={Landmark}
                  label="Next settlement"
                  value={data.summary.nextSettlementOn}
                />
                <SummaryRow
                  icon={ShieldCheck}
                  label="Settlement window"
                  value={data.summary.settlementWindow}
                />
              </WalletPanel>
            </section>

            <p className="mt-4 rounded-2xl bg-muted p-3 text-[0.68rem] font-medium text-muted-foreground">
              Updating payout bank details is not available yet — there is no backend endpoint for
              it. Contact support to change your settlement account.
            </p>
          </div>
        )}
      </div>
      <Toaster />
    </main>
  );
}
