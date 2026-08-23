import { createFileRoute } from "@tanstack/react-router";

import { BusinessRegistrationScreen } from "../screens/BusinessRegistrationScreen";
import { requirePartnerSession } from "../lib/auth-guard";

export const Route = createFileRoute("/registration")({
  beforeLoad: requirePartnerSession,
  head: () => ({
    meta: [
      { title: "Business Registration · QuickPress Partner" },
      { name: "description", content: "Register your laundry business on QuickPress." },
      { property: "og:title", content: "Business Registration · QuickPress Partner" },
      { property: "og:description", content: "Register your laundry business on QuickPress." },
    ],
  }),
  component: BusinessRegistrationScreen,
});
