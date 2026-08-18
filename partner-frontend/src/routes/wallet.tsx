import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { WalletScreen } from "../screens/WalletScreen";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Partner Wallet · QuickPress Partner" },
      { name: "description", content: "Balance, settlements and withdrawals for your store." },
      { property: "og:title", content: "Partner Wallet · QuickPress Partner" },
      { property: "og:description", content: "Balance, settlements and withdrawals for your store." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <WalletScreen />
    </PartnerProvider>
  ),
});
