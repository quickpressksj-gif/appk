import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { OtpVerificationScreen } from "../screens/OtpVerificationScreen";

export const Route = createFileRoute("/otp")({
  head: () => ({
    meta: [
      { title: "Verify Mobile · QuickPress Partner" },
      { name: "description", content: "Verify your mobile number to access the partner app." },
      { property: "og:title", content: "Verify Mobile · QuickPress Partner" },
      { property: "og:description", content: "Verify your mobile number to access the partner app." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <OtpVerificationScreen />
    </PartnerProvider>
  ),
});
