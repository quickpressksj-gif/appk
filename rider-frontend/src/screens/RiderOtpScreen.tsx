import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, MessageSquareLock, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { useRiderContext } from "../context/RiderContext";
import { useOtpCountdown } from "../hooks/use-otp-countdown";
import { fetchOnboardingStatus, requestOtp, verifyOtp } from "@/api/rider/rider-auth-api";
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

    try {
      const session = await verifyOtp(targetPhone || "9876543210", digits);
      signIn(session);

      // Fast check real onboarding status to avoid any intermediate flash
      const statusRes = await fetchOnboardingStatus(targetPhone).catch(() => null);
      const isActuallyOnboarded = Boolean(session.isOnboarded || statusRes?.isOnboarded || statusRes?.status === "active" || statusRes?.status === "pending");
      const isActuallyVerified = Boolean(session.isVerified || (statusRes?.isVerified && statusRes?.status === "active"));

      if (isActuallyVerified) {
        toast.success(`Welcome back, ${session.fullName || "Captain"}!`);
        navigate({ to: riderRoutes.dashboard });
      } else if (isActuallyOnboarded) {
        toast.success("Mobile number verified!");
        navigate({ to: riderRoutes.registrationSubmitted });
      } else {
        toast.success("Mobile number verified! Please complete registration.");
        navigate({ to: riderRoutes.registration });
      }
    } catch (cause) {
      setDigits("");
      inputRef.current?.focus();
      toast.error(
        cause instanceof Error ? cause.message : "That OTP is incorrect. Please try again.",
      );
    } finally {
      setBusy(false);
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
      restart();
      setDigits("");
      inputRef.current?.focus();
      toast.success("OTP sent again to your mobile number");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not resend OTP. Please try again.",
      );
    }
  };

  return (
    <main className="relative min-h-screen bg-slate-50/50 text-slate-900">
      <div className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-4 pb-8 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: riderRoutes.auth })}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.95]"
          >
            <ArrowLeft className="size-4.5" />
          </button>
          <span className="text-xs font-black text-slate-900">Verification</span>
          <div className="size-9" />
        </header>

        {/* OTP Input Card */}
        <div className="my-auto py-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-lg">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
              <MessageSquareLock className="size-6" strokeWidth={2.2} />
            </span>
            <h1 className="mt-3.5 text-xl font-black tracking-tight text-slate-900">
              Enter 6-Digit OTP
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              We have sent a verification code to{" "}
              <span className="font-bold text-slate-900">{displayPhone()}</span>
            </p>

            {/* OTP Digits Grid */}
            <div className="mt-5">
              <div className="relative">
                <input
                  ref={inputRef}
                  aria-label="OTP code"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digits}
                  onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
                />
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const isCurrent = digits.length === i;
                    const isFilled = Boolean(digits[i]);
                    return (
                      <div
                        key={i}
                        className={`flex h-13 sm:h-14 items-center justify-center rounded-xl border text-xl font-black tracking-tight shadow-sm transition-all duration-200 ${
                          isCurrent
                            ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/15"
                            : isFilled
                              ? "border-emerald-500 bg-emerald-50/60 text-emerald-800 font-black"
                              : "border-slate-200 bg-slate-50/50 text-slate-900"
                        }`}
                      >
                        {digits[i] ?? ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verify CTA */}
              <button
                type="button"
                disabled={busy || digits.length !== 6}
                onClick={() => void handleVerify()}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-black tracking-tight text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Verify &amp; Proceed
              </button>

              {/* Resend Action */}
              <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate({ to: riderRoutes.auth })}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900"
                >
                  Change mobile number
                </button>

                <button
                  type="button"
                  disabled={!canResend}
                  onClick={() => void handleResend()}
                  className="flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="size-3" />
                  {canResend ? "Resend OTP" : `Resend in ${remaining}s`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[10px] text-slate-400">
          Need help? Contact QuickPress Rider Support: 1800-QUICKPRESS
        </footer>
      </div>
      <Toaster />
    </main>
  );
}
