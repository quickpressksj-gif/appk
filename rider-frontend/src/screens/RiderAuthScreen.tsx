import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Phone,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { riderAssets } from "../assets/rider-assets";
import { useRiderContext } from "../context/RiderContext";
import { validateMobile } from "../lib/rider-validation";
import { riderRoutes } from "../navigation/rider-routes";
import { loginWithGoogle, rememberRiderLogin, requestOtp } from "@/api/rider/rider-auth-api";

const HIGHLIGHTS = [
  {
    icon: IndianRupee,
    title: "Daily Payouts",
    desc: "Instant bank transfers per delivery",
  },
  {
    icon: Timer,
    title: "Flexible Shifts",
    desc: "Log in & earn whenever you want",
  },
  {
    icon: ShieldCheck,
    title: "100% Insured",
    desc: "Accidental & trip cover included",
  },
];

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4.5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
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

  // Auto redirect if already signed in
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
    const rawDigits = value.replace(/\D/g, "");
    const last10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    const message = validateMobile(last10);
    setError(message);
    if (message) {
      toast.error(message);
      return;
    }

    setBusy(true);
    rememberRiderLogin(true);

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("qp.rider.pendingPhone", last10);
        window.localStorage.setItem("qp.rider.pendingPhone", last10);
      }
      setPhone(last10);
      await requestOtp(last10);
      toast.success(`OTP sent to +91 ${last10}`);
      navigate({ to: riderRoutes.otp });
    } catch (cause) {
      const text =
        cause instanceof Error ? cause.message : "Could not send OTP. Please check the number.";
      setError(text);
      toast.error(text);
    } finally {
      setBusy(false);
    }
  };

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

  // Format phone input nicely as 5 + 5 digits
  const formatDisplayValue = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  return (
    <main className="relative min-h-screen bg-slate-50/50 text-slate-900">
      {/* Background soft ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-4 pb-8 pt-6 lg:max-w-4xl lg:justify-center lg:py-12">
        {/* Top App Bar Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Bike className="size-5" strokeWidth={2.3} />
            </span>
            <div>
              <p className="text-sm font-black tracking-tight text-slate-900">
                QuickPress Rider
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Delivery Partner App
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
            <Sparkles className="size-3 text-emerald-600" />
            Join Fleet
          </span>
        </div>

        <div className="my-auto pt-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          {/* Left Hero Card */}
          <div className="space-y-4">
            <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl border border-slate-800">
              <div className="pointer-events-none absolute -right-6 -top-6 size-36 rounded-full bg-emerald-500/20 blur-2xl" />
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Zap className="size-3.5 fill-current" />
                <p className="text-[10px] font-black uppercase tracking-wider">
                  Partner Portal
                </p>
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Deliver Orders, Earn Daily &amp; Grow
              </h1>
              <p className="mt-1 text-xs text-slate-300">
                Join Kasganj &amp; Uttar Pradesh&apos;s leading on-demand laundry delivery network.
              </p>
              <img
                src={riderAssets.courier}
                alt="QuickPress Delivery Partner"
                className="mx-auto mt-3 h-32 w-auto object-contain drop-shadow-md sm:h-40"
                loading="lazy"
              />
            </section>

            {/* Value Highlights */}
            <div className="grid grid-cols-3 gap-2">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm text-center"
                >
                  <span className="mx-auto flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-800 mb-1.5">
                    <item.icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <p className="text-[11px] font-black text-slate-900">{item.title}</p>
                  <p className="text-[9px] font-medium text-slate-500 line-clamp-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Login Box */}
          <div className="mt-5 lg:mt-0">
            <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Phone className="size-3.5" />
                </span>
                <h2 className="text-base font-black tracking-tight text-slate-900">
                  Rider Mobile Login
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Enter your 10-digit mobile number to log in or create a new delivery partner account.
              </p>

              {/* Mobile Phone Input Box */}
              <div className="mt-4">
                <label
                  htmlFor="rider-phone"
                  className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Mobile Number
                </label>
                <div
                  className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50 px-3.5 py-3 transition-all duration-200 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 ${
                    error ? "border-rose-400 bg-rose-50/50" : "border-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1 text-sm font-extrabold text-slate-800">
                    🇮🇳 +91
                  </span>
                  <span className="h-5 w-px bg-slate-300" />
                  <input
                    id="rider-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    placeholder="98765 43210"
                    value={formatDisplayValue(value)}
                    aria-invalid={Boolean(error)}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setValue(cleaned);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleContinue();
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent text-base font-black tracking-wider text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                {error ? (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
                    {error}
                  </p>
                ) : null}
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                disabled={busy || value.replace(/\D/g, "").length < 10}
                onClick={() => void handleContinue()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-black tracking-tight text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Send OTP
                {busy ? null : <ArrowRight className="size-4" strokeWidth={2.5} />}
              </button>

              {/* Social Login Separator */}
              <div className="my-3.5 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  or
                </span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                disabled={googleBusy}
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-black tracking-tight text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
              >
                {googleBusy ? <Loader2 className="size-4 animate-spin" /> : <GoogleGlyph />}
                Continue with Google
              </button>

              <div className="mt-4 rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-500">
                  New rider? Enter mobile number to start simple 2-minute registration.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 text-center text-[10px] text-slate-400">
          QuickPress Delivery Partner App · Kasganj Operations Hub
        </footer>
      </div>
      <Toaster />
    </main>
  );
}
