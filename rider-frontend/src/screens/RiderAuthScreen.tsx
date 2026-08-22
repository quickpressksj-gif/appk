import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bike, IndianRupee, Loader2, ShieldCheck, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { riderAssets } from "../assets/rider-assets";
import { useRiderContext } from "../context/RiderContext";
import { validateMobile } from "../lib/rider-validation";
import { riderRoutes } from "../navigation/rider-routes";
import { loginWithGoogle, rememberRiderLogin, requestOtp } from "@/api/rider/rider-auth-api";

const HIGHLIGHTS = [
  { icon: IndianRupee, label: "Daily payouts", body: "Earn per trip with instant withdrawals" },
  { icon: Timer, label: "Flexible hours", body: "Go online whenever it suits you" },
  { icon: ShieldCheck, label: "Insured trips", body: "Every QuickPress delivery is covered" },
];

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.2-.2-1.7H12z"
      />
    </svg>
  );
}

export function RiderAuthScreen() {
  const navigate = useNavigate();
  const { setPhone, signIn, session, hydrating } = useRiderContext();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Auto login: a restored Firebase + JWT session skips the auth screen.
  useEffect(() => {
    if (hydrating || !session) return;
    if (!session.isOnboarded) {
      navigate({ to: riderRoutes.registration });
    } else if (!session.isVerified) {
      navigate({ to: riderRoutes.registrationSubmitted });
    } else {
      navigate({ to: riderRoutes.dashboard });
    }
  }, [hydrating, session, navigate]);

  const handleContinue = async () => {
    const message = validateMobile(value);
    setError(message);
    if (message) return;

    setBusy(true);
    // Remember login keeps the rider signed in across app restarts.
    rememberRiderLogin(true);
    // POST /api/auth/phone/send-otp — Firebase delivers the SMS.
    try {
      await requestOtp(value);
    } catch (cause) {
      const text =
        cause instanceof Error ? cause.message : "Could not send the OTP. Please try again.";
      setError(text);
      toast.error(text);
      setBusy(false);
      return;
    }
    setPhone(value);
    setBusy(false);
    navigate({ to: riderRoutes.otp });
  };

  /** Firebase Google Sign In → FastAPI exchange → QuickPress JWT session. */
  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      rememberRiderLogin(true);
      const next = await loginWithGoogle();
      signIn(next);
      toast.success("Signed in with Google");
      if (!next.isOnboarded) {
        navigate({ to: riderRoutes.registration });
      } else if (!next.isVerified) {
        navigate({ to: riderRoutes.registrationSubmitted });
      } else {
        navigate({ to: riderRoutes.dashboard });
      }
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Google sign-in could not be completed.",
      );
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-14 lg:max-w-5xl lg:justify-center lg:pt-20">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="animate-slide-up">
            <div className="flex items-center gap-2">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                <Bike className="size-5" strokeWidth={2.3} />
              </span>
              <div>
                <p className="text-lg font-black tracking-tight text-foreground">
                  QuickPress Rider
                </p>
                <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  Delivery Partner
                </p>
              </div>
            </div>

            <section className="relative mt-7 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
              <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
                Welcome back, partner
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-background sm:text-3xl">
                Pick up, drop off, get paid every day
              </h1>
              <img
                src={riderAssets.courier}
                alt="QuickPress delivery rider illustration"
                className="animate-float mx-auto mt-3 h-32 w-auto object-contain sm:h-44"
                loading="lazy"
              />
            </section>

            <section className="mt-6 space-y-3 sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0">
              {HIGHLIGHTS.map((item, index) => (
                <div
                  key={item.label}
                  className={`card-soft animate-rise ${["stagger-1", "stagger-2", "stagger-3"][index]} flex items-center gap-3 border border-border p-4 sm:flex-col sm:items-start`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                    <item.icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight text-foreground">{item.label}</p>
                    <p className="truncate text-[0.7rem] font-medium text-muted-foreground sm:whitespace-normal">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <section className="animate-slide-up mt-7 lg:mt-0 lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-8 lg:shadow-soft">
            <h2 className="hidden text-xl font-black tracking-tight text-foreground lg:block">
              Log in or sign up
            </h2>
            <label
              htmlFor="rider-phone"
              className="mt-0 block text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground lg:mt-5"
            >
              Mobile Number
            </label>
            <div
              className={`field-focus mt-2 flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-soft transition-colors duration-300 focus-within:border-primary ${
                error ? "border-destructive" : "border-border"
              }`}
            >
              <span className="text-sm font-bold text-foreground">+91</span>
              <span className="h-5 w-px bg-border" />
              <input
                id="rider-phone"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={value}
                aria-invalid={Boolean(error)}
                onChange={(e) => {
                  setValue(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {error ? (
              <p role="alert" className="mt-1 text-[0.68rem] font-semibold text-destructive">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleContinue()}
              className="ripple mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Send OTP
              {busy ? null : <ArrowRight className="size-4" strokeWidth={2.6} />}
            </button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
                or
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              disabled={googleBusy}
              onClick={handleGoogle}
              className="ripple flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-black tracking-tight text-foreground transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
            >
              {googleBusy ? <Loader2 className="size-4 animate-spin" /> : <GoogleGlyph />}
              Continue with Google
            </button>

            <p className="mt-3 text-center text-[0.68rem] font-medium leading-relaxed text-muted-foreground">
              One number for login and signup. New riders continue to registration.
            </p>
          </section>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
