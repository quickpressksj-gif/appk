import { createFileRoute } from "@tanstack/react-router";

import { WalletScreen } from "../screens/WalletScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/wallet")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Partner Wallet · QuickPress Partner" },
      { name: "description", content: "Instant withdrawals and transaction history." },
      { property: "og:title", content: "Partner Wallet · QuickPress Partner" },
      { property: "og:description", content: "Instant withdrawals and transaction history." },
    ],
  }),
  component: WalletScreen,
});
