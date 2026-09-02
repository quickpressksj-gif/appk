import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Edit2,
  Loader2,
  Lock,
  MessageSquareLock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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
      const isActuallyOnboarded = Boolean(
        session.isOnboarded ||
          statusRes?.isOnboarded ||
          statusRes?.status === "active" ||
          statusRes?.status === "pending"
      );
      const isActuallyVerified = Boolean(
        session.isVerified || (statusRes?.isVerified && statusRes?.status === "active")
      );

      if (isActuallyVerified) {
        toast.success(`Welcome back, Captain ${session.fullName || ""}! 🚀`);
        navigate({ to: riderRoutes.dashboard });
      } else if (isActuallyOnboarded) {
        toast.success("Mobile number verified! Checking approval status...");
        navigate({ to: riderRoutes.registrationSubmitted });
      } else {
        toast.success("Mobile verified! Complete your 2-minute registration.");
        navigate({ to: riderRoutes.registration });
      }
    } catch (cause) {
      setDigits("");
      inputRef.current?.focus();
      toast.error(
        cause instanceof Error ? cause.message : "That OTP is incorrect. Please try again."
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
      toast.success("New OTP sent to your mobile number");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not resend OTP. Please try again."
      );
    }
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-black">
      <Toaster position="top-center" richColors />

      {/* Radiant ambient glow orbs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-80 rounded-full bg-teal-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 pb-8 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => navigate({ to: riderRoutes.auth })}
            className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-sm transition-all hover:bg-white/10 active:scale-[0.95]"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-300">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Step 2 of 2 · Verification</span>
          </div>
          <div className="size-10" />
        </header>

        {/* OTP Input Card */}
        <div className="my-auto py-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 backdrop-blur-2xl shadow-2xl">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25">
              <MessageSquareLock className="size-7 stroke-[2.2]" />
            </span>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
              Enter 6-Digit OTP
            </h1>

            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400">
                Code sent to <span className="font-bold text-white">{displayPhone()}</span>
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: riderRoutes.auth })}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
              >
                <Edit2 className="size-3" />
                Change
              </button>
            </div>

            {/* Test Helper Tip */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-300">
              <Sparkles className="size-3.5 shrink-0 text-emerald-400" />
              <span>
                Dev / Testing Mode: Enter <strong>123456</strong> for instant login
              </span>
            </div>

            {/* OTP Digits Grid */}
            <div className="mt-6">
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
                        className={`flex h-14 sm:h-15 items-center justify-center rounded-2xl border text-2xl font-black tracking-tight shadow-sm transition-all duration-200 ${
                          isCurrent
                            ? "border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/30 text-emerald-300 scale-105"
                            : isFilled
                              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                              : "border-white/10 bg-slate-950/80 text-white"
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
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <Loader2 className="size-5 animate-spin text-slate-950" />
                ) : (
                  <>
                    <CheckCircle2 className="size-5 stroke-[2.5]" />
                    <span>Verify &amp; Continue</span>
                  </>
                )}
              </button>

              {/* Resend Action */}
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[11px] font-medium text-slate-400">
                  Didn&apos;t receive code?
                </span>

                <button
                  type="button"
                  disabled={!canResend}
                  onClick={() => void handleResend()}
                  className="flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="size-3.5" />
                  {canResend ? "Resend OTP Now" : `Resend in ${remaining}s`}
                </button>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-white/10 pt-4 text-[10px] font-semibold text-slate-400">
              <Lock className="size-3 text-emerald-400" />
              <span>Verified via UIDAI / Telecom Gateway</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-4 text-center text-[10px] font-semibold text-slate-500">
          QuickPress Rider Support Helpline: 1800-QUICKPRESS
        </footer>
      </div>
    </main>
  );
}
