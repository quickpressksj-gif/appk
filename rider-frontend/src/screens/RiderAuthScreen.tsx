import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Bike,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  X,
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
    title: "Daily Direct Payouts",
    desc: "Instant UPI & bank transfers per trip",
    badge: "100% Instant",
  },
  {
    icon: Timer,
    title: "Flexible Shifts",
    desc: "Work on your time, part-time or full-time",
    badge: "Own Schedule",
  },
  {
    icon: ShieldCheck,
    title: "₹5,00,000 Insurance",
    desc: "Free accidental & health coverage on road",
    badge: "Free Cover",
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
        cause instanceof Error ? cause.message : "Google sign-in could not be completed."
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
    <main className="relative min-h-screen bg-slate-50/80 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Toaster position="top-center" richColors />

      {/* Subtle ambient light glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-96 rounded-full bg-teal-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-4 pb-6 pt-safe">
        {/* Android Top App Bar Branding */}
        <header className="flex items-center justify-between border-b border-slate-200/80 pb-3 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9.5 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20">
              <Bike className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight text-slate-950">
                  Quick<span className="text-emerald-600">Press</span>
                </h1>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-300">
                  CAPTAIN
                </span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                On-Demand Delivery Fleet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800 shadow-2xs">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Kasganj Hub</span>
          </div>
        </header>

        {/* Main Content Area: Phone Optimized */}
        <div className="my-auto py-4 space-y-4">
          {/* Hero Card */}
          <section className="relative overflow-hidden rounded-3xl border border-emerald-600/20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-4.5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-6 -top-6 size-36 rounded-full bg-white/15 blur-xl" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-200">
                <Zap className="size-3.5 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Partner Fleet
                </span>
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                Earn Up to ₹25k/Mo
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black leading-tight tracking-tight text-white">
                  Deliver Laundry, Earn Daily
                </h2>
                <p className="mt-1 text-[11px] font-medium leading-snug text-emerald-100">
                  Daily direct UPI payouts, flexible hours &amp; Kasganj fleet protection.
                </p>
              </div>

              <img
                src={riderAssets.courier}
                alt="QuickPress Delivery Captain"
                className="h-20 w-auto object-contain drop-shadow-md shrink-0"
                loading="eager"
              />
            </div>

            {/* Earnings Ticker Strip */}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-[11px] backdrop-blur-md">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-200" />
                <span className="font-semibold text-white">Per Order:</span>
              </div>
              <span className="font-black text-emerald-100 text-xs">₹45 - ₹120 + 100% Tips</span>
            </div>
          </section>

          {/* 3 Mobile Highlight Chips */}
          <div className="grid grid-cols-3 gap-2">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-2xs text-center"
              >
                <div className="mx-auto flex size-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-1.5 border border-emerald-100">
                  <item.icon className="size-3.5 stroke-[2.3]" />
                </div>
                <p className="text-[10px] font-black text-slate-900 truncate">{item.title}</p>
                <p className="text-[8px] font-bold text-emerald-700 mt-0.5">{item.badge}</p>
              </div>
            ))}
          </div>

          {/* Mobile Login Card */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Phone className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-slate-900">
                    Captain Mobile Login
                  </h3>
                  <p className="text-[9px] font-semibold text-slate-500">
                    Login or Register in 2 Minutes
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                Step 1 of 2
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label
                  htmlFor="rider-phone"
                  className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1"
                >
                  Mobile Number
                </label>
                <div
                  className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50/80 px-3.5 py-3 transition-all duration-200 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 ${
                    error ? "border-rose-400 bg-rose-50/50" : "border-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1 text-sm font-black text-slate-900">
                    🇮🇳 +91
                  </span>
                  <span className="h-4.5 w-px bg-slate-300" />
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
                  {value ? (
                    <button
                      type="button"
                      onClick={() => {
                        setValue("");
                        setError(null);
                      }}
                      className="rounded-full p-1 text-slate-400 hover:text-slate-700 active:scale-95"
                    >
                      <X className="size-4" />
                    </button>
                  ) : null}
                </div>

                {error ? (
                  <p role="alert" className="mt-1 text-[11px] font-bold text-rose-600">
                    {error}
                  </p>
                ) : null}
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                We will send an SMS OTP to verify your mobile number.
              </p>

              {/* Submit Button */}
              <button
                type="button"
                disabled={busy || value.replace(/\D/g, "").length < 10}
                onClick={() => void handleContinue()}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-md shadow-emerald-600/25 transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {busy ? (
                  <Loader2 className="size-4.5 animate-spin text-white" />
                ) : (
                  <>
                    <span>Get 6-Digit OTP</span>
                    <ArrowRight className="size-4 stroke-[2.5] transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {/* Separator */}
              <div className="flex items-center gap-2.5 my-1.5">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  or
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                disabled={googleBusy}
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-black text-slate-800 shadow-2xs transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {googleBusy ? <Loader2 className="size-4 animate-spin" /> : <GoogleGlyph />}
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Security Trust Footnote */}
            <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[9px] font-semibold text-slate-500">
              <Lock className="size-3 text-emerald-600" />
              <span>256-Bit Encrypted · UIDAI &amp; NPCI Compliant</span>
            </div>
          </section>
        </div>

        {/* Android Footer */}
        <footer className="border-t border-slate-200/80 pt-2.5 pb-safe text-center text-[9px] font-semibold text-slate-500">
          QuickPress Captain App &copy; 2026 · Kasganj Fleet Hub
        </footer>
      </div>
    </main>
  );
}
