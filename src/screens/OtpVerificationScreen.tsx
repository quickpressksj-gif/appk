import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, MessageSquareLock, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerAuthHeader } from "../components/PartnerAuthHeader";
import { usePartnerContext } from "../context/PartnerContext";
import { useOtpCountdown } from "../hooks/use-otp-countdown";
import { partnerRoutes } from "../navigation/partner-routes";
import { PartnerTopBar } from "../components/PartnerTopBar";
import { requestOtp, verifyOtp } from "@backend/partner/partner-auth-api";

export function OtpVerificationScreen() {
  const navigate = useNavigate();
  const { phone, signIn } = usePartnerContext();
  const { remaining, canResend, restart } = useOtpCountdown(45);
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus the code field so the keyboard opens immediately
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy || verified) return;
    if (digits.length !== 6) {
      toast("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    // POST /api/auth/phone/verify — Firebase ID token → QuickPress JWT pair.
    let session;
    try {
      session = await verifyOtp(phone || "+91 98765 43210", digits);
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
    toast.success("Mobile number verified");
    window.setTimeout(() => {
      signIn(session);
      navigate({ to: partnerRoutes.registration });
    }, 850);
  };

  const handleResend = async () => {
    try {
      await requestOtp(phone);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not resend the OTP. Please try again.",
      );
      return;
    }
    restart();
    setDigits("");
    inputRef.current?.focus();
    toast.success("OTP sent again");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar title="Verify Mobile" onBack={() => navigate({ to: partnerRoutes.auth })} />

        <div className="px-5 pb-32 pt-6">
          <PartnerAuthHeader />

          <span className="animate-slide-up stagger-1 mt-6 flex size-14 items-center justify-center rounded-3xl bg-primary/15 text-brand-dark">
            <MessageSquareLock className="size-6" strokeWidth={2.2} />
          </span>
          <h1 className="animate-slide-up stagger-1 mt-4 text-2xl font-black leading-tight tracking-tight text-foreground">
            Enter the 6-digit code
          </h1>
          <p className="animate-slide-up stagger-2 mt-1 text-sm font-medium text-muted-foreground">
            Sent to +91 {phone || "98765 43210"}
          </p>

          <form onSubmit={(event) => void handleVerify(event)} className="mt-7">
            <div className="animate-slide-up stagger-3 relative">
              <input
                ref={inputRef}
                aria-label="OTP code"
                inputMode="numeric"
                autoComplete="one-time-code"
                enterKeyHint="go"
                maxLength={6}
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                {Array.from({ length: 6 }).map((_, i) => {
                  const filled = Boolean(digits[i]);
                  const active = digits.length === i;
                  return (
                    <div
                      key={i}
                      className={`flex h-14 flex-1 items-center justify-center rounded-2xl border bg-card text-lg font-black tracking-tight text-foreground shadow-soft transition-all duration-300 ${
                        verified
                          ? "border-brand-green"
                          : active
                            ? "-translate-y-0.5 border-primary shadow-cta"
                            : filled
                              ? "border-brand-dark/30"
                              : "border-border"
                      }`}
                    >
                      {filled ? <span className="animate-cell-pop block">{digits[i]}</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || verified || digits.length !== 6}
              aria-busy={busy}
              className="ripple focus-key mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black tracking-tight shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-50 data-[state=done]:bg-brand-green bg-primary text-primary-foreground"
              data-state={verified ? "done" : "idle"}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {verified ? <Check className="animate-success-pop size-4" strokeWidth={3} /> : null}
              {verified ? "Verified" : busy ? "Verifying" : "Verify & Continue"}
            </button>

            <button
              type="button"
              disabled={!canResend || verified}
              onClick={() => void handleResend()}
              className="focus-key mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[0.72rem] font-bold tracking-tight text-brand-green transition-colors disabled:text-muted-foreground"
            >
              <RotateCcw className="size-3.5" />
              {canResend ? "Resend OTP" : `Resend in ${remaining}s`}
            </button>
          </form>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
