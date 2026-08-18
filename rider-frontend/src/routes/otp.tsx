import { createFileRoute } from "@tanstack/react-router";

import { RiderProvider } from "../context/RiderContext";
import { RiderOtpScreen } from "../screens/RiderOtpScreen";

export const Route = createFileRoute("/otp")({
  head: () => ({
    meta: [
      { title: "Verify OTP · QuickPress Rider" },
      { name: "description", content: "Verify your mobile number to access the rider dashboard." },
      { property: "og:title", content: "Verify OTP · QuickPress Rider" },
      { property: "og:description", content: "Verify your mobile number to access the rider dashboard." },
    ],
  }),
  component: () => (
    <RiderProvider>
      <RiderOtpScreen />
    </RiderProvider>
  ),
});
