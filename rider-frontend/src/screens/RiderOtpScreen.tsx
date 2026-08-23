import { useNavigate } from "@tanstack/react-router";
import { Loader2, MessageSquareLock, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { RiderTopBar } from "../components/RiderTopBar";
import { useRiderContext } from "../context/RiderContext";
import { useOtpCountdown } from "../hooks/use-otp-countdown";
import { requestOtp, verifyOtp } from "@/api/rider/rider-auth-api";
import { riderRoutes } from "../navigation/rider-routes";

export function RiderOtpScreen() {
  const navigate = useNavigate();
  const { phone, signIn } = useRiderContext();
  const { remaining, canResend, restart } = useOtpCountdown(45);
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetPhone =
    phone ||
    (typeof window !== "undefined"
      ? window.sessionStorage.getItem("qp.rider.pendingPhone") ||
        window.localStorage.getItem("qp.rider.pendingPhone") ||
        ""
      : "");

  const displayPhone = () => {
    const digitsOnly = targetPhone.replace(/\D/g, "");
    if (!digitsOnly) return "+91 98765 43210";
    const last10 = digitsOnly.slice(-10);
    return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async () => {
    if (busy) return;
    if (digits.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP code");
      return;
    }
    setBusy(true);
    // POST /api/auth/phone/verify — Firebase ID token → QuickPress JWT pair.
    let session;
    try {
      session = await verifyOtp(targetPhone || "9876543210", digits);
    } catch (cause) {
      setBusy(false);
      setDigits("");
      inputRef.current?.focus();
      toast.error(
        cause instanceof Error ? cause.message : "That OTP is incorrect. Please try again.",
      );
      return;
    }
    setBusy(false);
    signIn(session);

    if (!session.isOnboarded) {
      toast.success("Mobile number verified! Please complete registration.");
      navigate({ to: riderRoutes.registration });
    } else if (!session.isVerified) {
      toast.success("Mobile number verified!");
      navigate({ to: riderRoutes.registrationSubmitted });
    } else {
      toast.success(`Welcome back, ${session.fullName}!`);
      navigate({ to: riderRoutes.dashboard });
    }
  };

  // Auto-submit on 6 digits
  useEffect(() => {
    if (digits.length === 6 && !busy) {
      void handleVerify();
    }
  }, [digits, busy]);

  const handleResend = async () => {
    try {
      await requestOtp(targetPhone);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not resend the OTP. Please try again.",
      );
      return;
    }
    restart();
    setDigits("");
    inputRef.current?.focus();
    toast.success("OTP sent again to your mobile number");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <RiderTopBar title="Verify Mobile" onBack={() => navigate({ to: riderRoutes.auth })} />

        <div className="px-5 pb-32 pt-6">
          <span className="flex size-14 items-center justify-center rounded-3xl bg-primary/15 text-brand-dark">
            <MessageSquareLock className="size-6" strokeWidth={2.2} />
          </span>
          <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-foreground">
            Enter the 6-digit code
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Sent to {displayPhone()}
          </p>

          <div className="mt-7">
            <div className="relative">
              <input
                ref={inputRef}
                aria-label="OTP code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex h-14 flex-1 items-center justify-center rounded-2xl border bg-card text-lg font-black tracking-tight text-foreground shadow-soft transition-all duration-300 ${
                      digits.length === i
                        ? "border-primary ring-2 ring-primary/20"
                        : digits[i]
                          ? "border-brand-green/60 bg-secondary/5 text-brand-green"
                          : "border-border"
                    }`}
                  >
                    {digits[i] ?? ""}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={busy || digits.length !== 6}
              onClick={() => void handleVerify()}
              className="ripple mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Verify & Continue
            </button>

            <button
              type="button"
              disabled={!canResend}
              onClick={() => void handleResend()}
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-bold tracking-tight text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              <RotateCcw className="size-3.5" />
              {canResend ? "Resend OTP" : `Resend in ${remaining}s`}
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
