import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { PartnerShopProvider } from "../context/PartnerShopContext";
import { ShopManagementScreen } from "../screens/ShopManagementScreen";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Management · QuickPress Partner" },
      {
        name: "description",
        content:
          "Manage your QuickPress shop profile, gallery, business hours, service area and status.",
      },
      { property: "og:title", content: "Shop Management · QuickPress Partner" },
      {
        property: "og:description",
        content:
          "Manage your QuickPress shop profile, gallery, business hours, service area and status.",
      },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <PartnerShopProvider>
        <ShopManagementScreen />
      </PartnerShopProvider>
    </PartnerProvider>
  ),
});
