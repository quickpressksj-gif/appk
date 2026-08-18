import { Outlet, createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";

/** Wallet layout — hosts /wallet and /wallet/withdraw. */
export const Route = createFileRoute("/wallet")({
  component: () => (
    <PartnerProvider>
      <Outlet />
    </PartnerProvider>
  ),
});
