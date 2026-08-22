import { createFileRoute } from "@tanstack/react-router";

import { PartnerProfileScreen } from "../screens/PartnerProfileScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/profile")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Partner Profile · QuickPress Partner" },
      { name: "description", content: "Store account information, bank details and KYC documents." },
      { property: "og:title", content: "Partner Profile · QuickPress Partner" },
      { property: "og:description", content: "Store account information, bank details and KYC documents." },
    ],
  }),
  component: PartnerProfileScreen,
});
