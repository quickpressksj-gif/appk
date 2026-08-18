import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerAuthHeader } from "../components/PartnerAuthHeader";
import { partnerAssets } from "../assets/partner-assets";
import { usePartnerContext } from "../context/PartnerContext";
import { partnerRoutes } from "../navigation/partner-routes";
import { validateMobile } from "../lib/partner-validation";
import {
  loginWithGoogle,
  rememberPartnerLogin,
  requestOtp,
} from "@/api/partner/partner-auth-api";

const HIGHLIGHTS = [
  { icon: TrendingUp, label: "Grow orders", body: "Reach thousands of nearby customers" },
  { icon: ShieldCheck, label: "Assured payouts", body: "Weekly settlements, zero paperwork" },
  { icon: Sparkles, label: "Smart tools", body: "Live orders, rates and earnings" },
];

const STAGGER = ["stagger-3", "stagger-4", "stagger-5"];

/** Local-only "remember this device" preference (no backend involved). */
const REMEMBER_KEY = "qp.partner.rememberedPhone";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6a5.7 5.7 0 0 1-2.4 3.7v3h3.8c2.3-2.1 3.5-5.2 3.5-8.6Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-3c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l3.9-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l3.9 3.1c1-2.9 3.7-4.9 6.8-4.9Z"
      />
    </svg>
  );
}

export function PartnerAuthScreen() {
  const navigate = useNavigate();
  const { setPhone, signIn, session, hydrating } = usePartnerContext();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const isValid = validateMobile(value) === null;

  // Auto login: a restored Firebase + JWT session skips the auth screen.
  useEffect(() => {
    if (hydrating || !session) return;
    navigate({ to: session.isOnboarded ? partnerRoutes.dashboard : partnerRoutes.registration });
  }, [hydrating, session, navigate]);

  // Restore the remembered number after hydration (client-only storage read).
  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setValue(saved);
      setRemember(true);
    }
  }, []);

  const handleContinue = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy || sent) return;

    const message = validateMobile(value);
    if (message) {
      setError(message);
      toast(message);
      return;
    }
    setError(null);
    setBusy(true);

    const digits = value.replace(/\D/g, "");
    if (remember) window.localStorage.setItem(REMEMBER_KEY, digits);
    else window.localStorage.removeItem(REMEMBER_KEY);
    // Remember login: keeps the QuickPress session across browser restarts.
    rememberPartnerLogin(remember);

    // POST /api/auth/phone/send-otp — Firebase delivers the SMS.
    try {
      await requestOtp(digits);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Could not send the OTP. Please try again.";
      setError(message);
      toast.error(message);
      setBusy(false);
      return;
    }
    setPhone(digits);
    setBusy(false);
    setSent(true);
    toast.success("OTP sent to your mobile");

    window.setTimeout(() => navigate({ to: partnerRoutes.otp }), 750);
  };

  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      const session = await loginWithGoogle();
      signIn(session);
      toast.success("Signed in with Google");
      navigate({ to: session.isOnboarded ? partnerRoutes.dashboard : partnerRoutes.registration });
    } catch {
      toast("Google Sign In will activate once the partner account is linked");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-14">
        <PartnerAuthHeader />

        <section className="animate-slide-up stagger-2 relative mt-7 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
          <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
            Partner with us
          </p>
          <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-background">
            Run your laundry business on autopilot
          </h1>
          <img
            src={partnerAssets.laundryPickup}
            alt="QuickPress partner shop pickup illustration"
            className="animate-float mx-auto mt-3 h-32 w-auto object-contain"
            loading="lazy"
          />
        </section>

        <section className="mt-6 space-y-3">
          {HIGHLIGHTS.map((item, index) => (
            <div
              key={item.label}
              className={`card-soft animate-slide-up ${STAGGER[index] ?? ""} flex items-center gap-3 border border-border p-4`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                <item.icon className="size-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-foreground">{item.label}</p>
                <p className="truncate text-[0.7rem] font-medium text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Sticky, thumb-reachable action zone for one-hand use */}
        <form
          onSubmit={(event) => void handleContinue(event)}
          className="animate-slide-up stagger-6 glass-panel sticky bottom-0 z-20 -mx-5 mt-auto rounded-t-3xl px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
        >
          <label
            htmlFor="partner-phone"
            className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Mobile Number
          </label>
          <div
            className={`field-focus mt-2 flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-soft ${
              error ? "border-destructive" : "border-border"
            }`}
          >
            <span className="text-sm font-bold text-foreground">+91</span>
            <span className="h-5 w-px bg-border" />
            <input
              id="partner-phone"
              inputMode="numeric"
              autoComplete="tel"
              enterKeyHint="go"
              maxLength={10}
              placeholder="98765 43210"
              value={value}
              onChange={(e) => {
                setValue(e.target.value.replace(/\D/g, ""));
                if (error) setError(null);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
            />
            {isValid ? (
              <ShieldCheck
                className="animate-success-pop size-4 text-brand-green"
                strokeWidth={2.6}
                aria-hidden
              />
            ) : null}
          </div>
          {error ? (
            <p className="animate-soft-fade mt-1.5 text-[0.68rem] font-semibold text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            role="checkbox"
            aria-checked={remember}
            onClick={() => setRemember((prev) => !prev)}
            className="focus-key mt-3 flex items-center gap-2 rounded-xl py-1 text-left"
          >
            <span
              className={`flex size-5 items-center justify-center rounded-md border transition-all duration-300 ${
                remember
                  ? "border-brand-green bg-brand-green text-background"
                  : "border-border bg-card"
              }`}
            >
              {remember ? <Check className="size-3.5" strokeWidth={3.4} /> : null}
            </span>
            <span className="text-[0.72rem] font-semibold text-muted-foreground">
              Remember this number on this device
            </span>
          </button>

          <button
            type="submit"
            disabled={busy || sent || !isValid}
            aria-busy={busy}
            className="ripple focus-key mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-50"
          >
            {sent ? (
              <Check className="animate-success-pop size-4" strokeWidth={3} />
            ) : busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {sent ? "OTP Sent" : busy ? "Sending OTP" : "Send OTP"}
            {busy || sent ? null : <ArrowRight className="size-4" strokeWidth={2.6} />}
          </button>

          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={googleBusy}
            aria-busy={googleBusy}
            className="ripple focus-key flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-card py-3.5 text-sm font-black tracking-tight text-foreground shadow-soft transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
          >
            {googleBusy ? <Loader2 className="size-4 animate-spin" /> : <GoogleGlyph />}
            {googleBusy ? "Connecting" : "Continue with Google"}
          </button>

          <p className="mt-3 text-center text-[0.68rem] font-medium leading-relaxed text-muted-foreground">
            By continuing you agree to the QuickPress Partner Terms and Privacy Policy.
          </p>
        </form>
      </div>
      <Toaster />
    </main>
  );
}
