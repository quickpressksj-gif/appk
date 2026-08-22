import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  MessageSquareLock,
  Phone,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { usePartnerContext } from "../context/PartnerContext";
import { useOtpCountdown } from "../hooks/use-otp-countdown";
import { partnerRoutes } from "../navigation/partner-routes";
import { requestOtp, verifyOtp } from "@/api/partner/partner-auth-api";

export function OtpVerificationScreen() {
  const navigate = useNavigate();
  const { phone, signIn } = usePartnerContext();
  const { remaining, canResend, restart } = useOtpCountdown(45);
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetPhone =
    phone ||
    (typeof window !== "undefined"
      ? window.sessionStorage.getItem("qp.partner.pendingPhone") ||
        window.localStorage.getItem("qp.partner.pendingPhone") ||
        window.localStorage.getItem("qp.partner.rememberedPhone") ||
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

  useEffect(() => {
    if (digits.length === 6 && !busy && !verified) {
      void handleVerify();
    }
  }, [digits, busy, verified]);

  const handleVerify = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy || verified) return;
    if (digits.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setBusy(true);

    let session;
    try {
      session = await verifyOtp(targetPhone, digits);
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
    setVerified(true);
    toast.success("Mobile number verified successfully!");
    window.setTimeout(() => {
      signIn(session);
      if (!session.isOnboarded) {
        navigate({ to: partnerRoutes.registration });
      } else if (!session.isVerified) {
        navigate({ to: partnerRoutes.registrationSubmitted });
      } else {
        navigate({ to: partnerRoutes.dashboard });
      }
    }, 600);
  };

  const handleResend = async () => {
    try {
      await requestOtp(targetPhone);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not resend OTP. Please try again.",
      );
      return;
    }
    restart();
    setDigits("");
    inputRef.current?.focus();
    toast.success("New OTP sent to your phone");
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900">
      {/* ========================================================================= */}
      {/* MOBILE OTP SCREEN (< md)                                                  */}
      {/* ========================================================================= */}
      <div className="flex min-h-screen flex-col justify-between bg-white md:hidden">
        <div className="p-5 pt-8">
          <button
            type="button"
            onClick={() => navigate({ to: partnerRoutes.auth })}
            className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="mt-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
              <KeyRound className="size-6" />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-zinc-900">
              Verify OTP Code
            </h1>
            <p className="mt-1 text-xs text-zinc-500 font-medium">
              We have sent a 6-digit verification code to <span className="font-black text-zinc-900">{displayPhone()}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="mt-8">
            <div className="relative">
              <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="absolute inset-0 z-10 size-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                {Array.from({ length: 6 }).map((_, i) => {
                  const filled = Boolean(digits[i]);
                  const active = digits.length === i;
                  return (
                    <div
                      key={i}
                      className={`flex h-13 flex-1 items-center justify-center rounded-2xl border-2 bg-zinc-50 text-xl font-black tracking-tight text-zinc-900 transition-all ${
                        verified
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : active
                          ? "border-zinc-950 bg-white shadow-xs scale-105"
                          : filled
                          ? "border-zinc-400 bg-white"
                          : "border-zinc-200"
                      }`}
                    >
                      {filled ? digits[i] : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || verified || digits.length !== 6}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 font-black text-xs uppercase tracking-wider text-zinc-950 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : verified ? (
                <>
                  <Check className="size-4 stroke-[3]" />
                  <span>Verified! Logging in...</span>
                </>
              ) : (
                <span>Verify & Enter Store →</span>
              )}
            </button>

            <div className="mt-5 text-center">
              <button
                type="button"
                disabled={!canResend || verified}
                onClick={handleResend}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-950 disabled:text-zinc-400"
              >
                <RotateCcw className="size-3.5" />
                <span>{canResend ? "Resend OTP SMS" : `Resend OTP in ${remaining}s`}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-zinc-50 p-4 text-center border-t border-zinc-100">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-500">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Encrypted Mobile Number Verification</span>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP OTP SCREEN (>= md)                                                */}
      {/* ========================================================================= */}
      <div className="hidden min-h-screen md:grid md:grid-cols-12">
        <div className="relative col-span-7 flex flex-col justify-between bg-zinc-950 p-12 lg:p-16 text-white overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-400 font-black text-zinc-950 text-xl shadow-lg">
              QP
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">QuickPress</span>
              <span className="ml-2 rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                Security Check
              </span>
            </div>
          </div>

          <div className="relative z-10 max-w-xl my-auto py-12">
            <h2 className="text-4xl font-black leading-tight tracking-tight lg:text-5xl">
              Two-factor protection for your business account.
            </h2>
            <p className="mt-4 text-sm font-medium text-zinc-400 leading-relaxed">
              Every sign in is secured with instant one-time password verification to protect your orders, settlement ledger, and customer data.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-zinc-800/80 pt-6 text-xs text-zinc-400">
            <span>© 2026 QuickPress Technologies Inc.</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Direct Bank Vault Connected
            </span>
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-center bg-white p-8 lg:p-14">
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.auth })}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-6"
            >
              <ArrowLeft className="size-3.5" />
              <span>Change phone number</span>
            </button>

            <div>
              <h3 className="text-2xl font-black tracking-tight text-zinc-900">Enter OTP Code</h3>
              <p className="mt-1.5 text-xs font-medium text-zinc-500">
                Code sent to <span className="font-black text-zinc-900">{displayPhone()}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="mt-8 space-y-6">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digits}
                  onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="absolute inset-0 z-10 size-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
                />
                <div className="flex items-center justify-between gap-3">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const filled = Boolean(digits[i]);
                    const active = digits.length === i;
                    return (
                      <div
                        key={i}
                        className={`flex h-14 flex-1 items-center justify-center rounded-2xl border-2 bg-zinc-50 text-2xl font-black tracking-tight text-zinc-900 transition-all ${
                          verified
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : active
                            ? "border-zinc-950 bg-white shadow-md scale-105"
                            : filled
                            ? "border-zinc-400 bg-white"
                            : "border-zinc-200"
                        }`}
                      >
                        {filled ? digits[i] : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || verified || digits.length !== 6}
                className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 font-black text-xs uppercase tracking-wider text-zinc-950 shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : verified ? (
                  <>
                    <Check className="size-4 stroke-[3]" />
                    <span>Verified! Redirecting...</span>
                  </>
                ) : (
                  <span>Verify Code & Sign In</span>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  disabled={!canResend || verified}
                  onClick={handleResend}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-950 disabled:text-zinc-400 cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{canResend ? "Resend OTP SMS" : `Resend OTP in ${remaining}s`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
