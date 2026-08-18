import { Toaster } from "@/shared/ui/sonner";

import { SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { WalletStateView } from "../../components/wallet/WalletStates";

/**
 * Incentives Screen.
 *
 * MISSING BACKEND ENDPOINT: there is no `GET /api/rider/incentives` (nor any
 * achievements/rewards endpoint) in the FastAPI backend. Rather than fabricate
 * bonuses, quests or unlocked rewards, this screen shows an honest
 * "not available yet" state.
 */
export function IncentivesScreen() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Incentives"
          subtitle="Bonuses, quests and targets"
          action={<RiderBellAction count={0} />}
        />

        <div className="px-5 pb-32 pt-6">
          <WalletStateView state="no-incentives" />

          <section className="mt-6">
            <SectionHeading title="Achievement Rewards" />
            <p className="mt-3 rounded-2xl bg-muted p-3 text-[0.68rem] font-medium text-muted-foreground">
              Achievement rewards are not available yet. Your real earnings and payouts are
              available under Wallet and Transactions.
            </p>
          </section>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
