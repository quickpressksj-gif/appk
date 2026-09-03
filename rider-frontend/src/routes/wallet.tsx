import { createFileRoute } from "@tanstack/react-router";
import { RiderWalletScreen } from "../screens/RiderWalletScreen";

export const Route = createFileRoute("/wallet")({
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
