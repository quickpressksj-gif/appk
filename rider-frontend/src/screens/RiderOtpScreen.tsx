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
    <main className="relative min-h-screen bg-slate-50/80 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Toaster position="top-center" richColors />

      {/* Ambient lighting */}
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-80 rounded-full bg-teal-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 pb-8 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <button
            type="button"
            onClick={() => navigate({ to: riderRoutes.auth })}
            className="flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.95] cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800 shadow-xs">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Step 2 of 2 · Verification</span>
          </div>
          <div className="size-10" />
        </header>

        {/* OTP Input Card */}
        <div className="my-auto py-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <MessageSquareLock className="size-7 stroke-[2.2]" />
            </span>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Enter 6-Digit OTP
            </h1>

            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Code sent to <span className="font-bold text-slate-900">{displayPhone()}</span>
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: riderRoutes.auth })}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                <Edit2 className="size-3" />
                Change
              </button>
            </div>

            {/* Production Instruction */}
            <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
              Please enter the 6-digit verification code sent via SMS to your mobile number.
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
                        className={`flex h-14 sm:h-15 items-center justify-center rounded-2xl border text-2xl font-black tracking-tight shadow-sm transition-all duration-200 ${
                          isCurrent
                            ? "border-emerald-600 bg-white ring-2 ring-emerald-500/20 text-slate-900 scale-105"
                            : isFilled
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-black"
                              : "border-slate-200 bg-slate-50 text-slate-900"
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
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-md shadow-emerald-600/25 transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {busy ? (
                  <Loader2 className="size-5 animate-spin text-white" />
                ) : (
                  <>
                    <CheckCircle2 className="size-5 stroke-[2.5]" />
                    <span>Verify &amp; Continue</span>
                  </>
                )}
              </button>

              {/* Resend Action */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] font-medium text-slate-500">
                  Didn&apos;t receive code?
                </span>

                <button
                  type="button"
                  disabled={!canResend}
                  onClick={() => void handleResend()}
                  className="flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  {canResend ? "Resend OTP Now" : `Resend in ${remaining}s`}
                </button>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-[10px] font-semibold text-slate-500">
              <Lock className="size-3 text-emerald-600" />
              <span>Verified via UIDAI &amp; Telecom Gateway</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 pt-4 text-center text-[10px] font-semibold text-slate-500">
          QuickPress Rider Support Helpline: 1800-QUICKPRESS
        </footer>
      </div>
    </main>
  );
}
