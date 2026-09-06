import { createFileRoute } from "@tanstack/react-router";
import { RiderWalletScreen } from "../screens/RiderWalletScreen";
import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/wallet")({
  beforeLoad: () => {
    requireRiderAuth();
  },
  head: () => ({
    meta: [
      { title: "Finance & Wallet — QuickPress Captain" },
      {
        name: "description",
        content: "QuickPress Captain Payouts, Wallet & Bank Settlements",
      },
    ],
  }),
  component: RiderWalletScreen,
});
