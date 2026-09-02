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
    <main className="relative min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-black">
      <Toaster position="top-center" richColors />

      {/* Radiant ambient glow orbs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-96 rounded-full bg-teal-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 pb-8 pt-6 lg:max-w-5xl lg:justify-center lg:py-12">
        {/* Top App Bar Branding */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/25">
              <Bike className="size-5.5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  Quick<span className="text-emerald-400">Press</span>
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                  CAPTAIN
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                On-Demand Delivery Fleet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kasganj Hub Active</span>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="my-auto py-8 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* Left Column: Hero & Benefits */}
          <div className="space-y-5 lg:col-span-7">
            {/* Hero Card */}
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/40 p-6 backdrop-blur-xl shadow-2xl">
              <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-emerald-500/20 blur-3xl" />

              <div className="flex items-center gap-2 text-emerald-400">
                <Zap className="size-4 fill-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Captain Partner Portal
                </span>
              </div>

              <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Deliver Laundry, Earn Daily &amp; Grow with{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                  QuickPress
                </span>
              </h2>

              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-300 sm:text-sm">
                Join Kasganj &amp; Uttar Pradesh’s highest-rated delivery network. Earn up to{" "}
                <span className="font-bold text-emerald-400">₹25,000+/month</span> with zero joining fee.
              </p>

              {/* Earnings Ticker Strip */}
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Average Payout / Order:</span>
                </div>
                <span className="font-black text-emerald-300 text-sm">₹45 - ₹120 + 100% Tips</span>
              </div>

              <div className="mt-4 flex justify-center">
                <img
                  src={riderAssets.courier}
                  alt="QuickPress Delivery Captain"
                  className="h-32 w-auto object-contain drop-shadow-2xl sm:h-40"
                  loading="lazy"
                />
              </div>
            </section>

            {/* 3 Highlight Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="group relative rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur-md transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/90"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-transform group-hover:scale-110">
                      <item.icon className="size-4 stroke-[2.3]" />
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-black text-emerald-400 border border-emerald-500/20">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs font-black text-white">{item.title}</p>
                  <p className="mt-0.5 text-[9px] font-medium text-slate-400 line-clamp-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Phone Login Card */}
          <div className="mt-6 lg:col-span-5 lg:mt-0">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Phone className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-white">
                      Captain Mobile Login
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400">
                      OTP Authentication · Login or Register
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                  Step 1 of 2
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="rider-phone"
                    className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    Mobile Number
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-2xl border bg-slate-950/80 px-4 py-3.5 transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 ${
                      error ? "border-rose-500 bg-rose-950/20" : "border-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-black text-emerald-400">
                      🇮🇳 +91
                    </span>
                    <span className="h-5 w-px bg-white/15" />
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
                      className="min-w-0 flex-1 bg-transparent text-base font-black tracking-wider text-white outline-none placeholder:text-slate-500 placeholder:font-normal"
                    />
                    {value ? (
                      <button
                        type="button"
                        onClick={() => {
                          setValue("");
                          setError(null);
                        }}
                        className="rounded-full p-1 text-slate-400 hover:text-white"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  {error ? (
                    <p role="alert" className="mt-1.5 text-xs font-bold text-rose-400">
                      {error}
                    </p>
                  ) : null}
                </div>

                {/* Instant Verification Hint */}
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[11px] text-emerald-300">
                  <Sparkles className="size-3.5 shrink-0 text-emerald-400" />
                  <span>Enter active mobile number. Dev OTP: <strong>123456</strong></span>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  disabled={busy || value.replace(/\D/g, "").length < 10}
                  onClick={() => void handleContinue()}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <Loader2 className="size-4.5 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <span>Get 6-Digit OTP</span>
                      <ArrowRight className="size-4.5 stroke-[2.5] transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* Separator */}
                <div className="flex items-center gap-3 my-2">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    or
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  disabled={googleBusy}
                  onClick={handleGoogle}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-black text-white shadow-sm transition-all duration-200 hover:bg-white/10 active:scale-[0.98] disabled:opacity-60"
                >
                  {googleBusy ? <Loader2 className="size-4 animate-spin" /> : <GoogleGlyph />}
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Security Trust Footnote */}
              <div className="mt-5 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-[10px] font-semibold text-slate-400">
                <Lock className="size-3 text-emerald-400" />
                <span>256-Bit Encrypted · UIDAI &amp; NPCI Compliant</span>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-4 text-center text-[10px] font-semibold text-slate-500">
          QuickPress Delivery Fleet &copy; 2026 · Kasganj Operations Hub · Support: 1800-QUICKPRESS
        </footer>
      </div>
    </main>
  );
}
