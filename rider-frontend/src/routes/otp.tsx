import { createFileRoute } from "@tanstack/react-router";
import { RiderOtpScreen } from "../screens/RiderOtpScreen";

export const Route = createFileRoute("/otp")({
  head: () => ({
    meta: [
      { title: "Verify OTP — QuickPress Captain" },
      {
        name: "description",
        content: "QuickPress Captain OTP Verification",
      },
    ],
  }),
  component: RiderOtpScreen,
});
