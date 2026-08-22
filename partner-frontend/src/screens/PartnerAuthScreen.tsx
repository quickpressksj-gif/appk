import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Coins,
  CreditCard,
  Headphones,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { usePartnerContext } from "../context/PartnerContext";
import { partnerRoutes } from "../navigation/partner-routes";
import { validateMobile } from "../lib/partner-validation";
import {
  loginWithGoogle,
  rememberPartnerLogin,
  requestOtp,
} from "@/api/partner/partner-auth-api";

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "3X More Customer Orders",
    desc: "Direct access to thousands of daily nearby customers looking for laundry & dry cleaning.",
  },
  {
    icon: Coins,
    title: "Weekly Direct Settlements",
    desc: "100% assured weekly bank payouts with detailed GST invoice breakdowns.",
  },
  {
    icon: Truck,
    title: "Dedicated Logistics Riders",
    desc: "QuickPress delivery partners handle all customer pickups and doorstep drop-offs.",
  },
  {
    icon: Headphones,
    title: "24/7 Dedicated Partner Support",
    desc: "Priority phone support and dedicated store account manager assistance.",
  },
];

const REMEMBER_KEY = "qp.partner.rememberedPhone";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 shrink-0">
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

  // If already authenticated, redirect away from /auth immediately
  useEffect(() => {
    if (hydrating || !session) return;
    if (!session.isOnboarded) {
      navigate({ to: partnerRoutes.registration });
    } else if (!session.isVerified) {
      navigate({ to: partnerRoutes.registrationSubmitted });
    } else {
      navigate({ to: partnerRoutes.dashboard });
    }
  }, [hydrating, session, navigate]);

  // Restore remembered number
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
      toast.error(message);
      return;
    }
    setError(null);
    setBusy(true);

    const digits = value.replace(/\D/g, "");
    if (remember) window.localStorage.setItem(REMEMBER_KEY, digits);
    else window.localStorage.removeItem(REMEMBER_KEY);
    rememberPartnerLogin(remember);

    try {
      await requestOtp(digits);
      setPhone(digits);
      setSent(true);
      toast.success("OTP sent to your mobile number");
      window.setTimeout(() => navigate({ to: partnerRoutes.otp }), 600);
    } catch (cause) {
      const msg =
        cause instanceof Error ? cause.message : "Could not send OTP. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      const sess = await loginWithGoogle();
      signIn(sess);
      toast.success("Signed in with Google");
      if (!sess.isOnboarded) {
        navigate({ to: partnerRoutes.registration });
      } else if (!sess.isVerified) {
        navigate({ to: partnerRoutes.registrationSubmitted });
      } else {
        navigate({ to: partnerRoutes.dashboard });
      }
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Google Sign In was cancelled or failed",
      );
    } finally {
      setGoogleBusy(false);
    }
  };

  const fillDemoNumber = (num: string) => {
    setValue(num);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900">
      {/* ========================================================================= */}
      {/* MOBILE ZOMATO-STYLE AUTH SCREEN (< md)                                    */}
      {/* ========================================================================= */}
      <div className="flex min-h-screen flex-col justify-between bg-white md:hidden">
        {/* Top Header & Brand */}
        <div className="p-5 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-400 font-black text-zinc-950 shadow-xs">
                QP
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-zinc-900">QuickPress</h1>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Partner Console
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 border border-emerald-200">
              <BadgeCheck className="size-3" />
              <span>Verified Network</span>
            </span>
          </div>

          {/* Hero Banner Card */}
          <div className="mt-5 rounded-3xl bg-zinc-950 p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 size-32 bg-amber-400/20 rounded-full blur-2xl" />
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black text-amber-300">
              <Sparkles className="size-3" />
              <span>Grow Your Outlet</span>
            </span>
            <h2 className="mt-2 text-xl font-black leading-tight tracking-tight">
              Manage Orders & Rates on Autopilot
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Join 500+ laundry stores receiving orders daily with instant weekly payouts.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleContinue} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="mobile-input-mob"
                className="block text-xs font-black uppercase tracking-wider text-zinc-600"
              >
                Enter Registered Mobile Number
              </label>
              <div
                className={`mt-2 flex h-13 items-center rounded-2xl border-2 bg-zinc-50 px-3.5 transition-all ${
                  error
                    ? "border-red-500 bg-red-50/20"
                    : "border-zinc-200 focus-within:border-zinc-900 focus-within:bg-white"
                }`}
              >
                <span className="flex items-center gap-1.5 border-r border-zinc-300 pr-3 text-xs font-black text-zinc-800">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </span>
                <input
                  id="mobile-input-mob"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value.replace(/\D/g, "").slice(0, 10));
                    if (error) setError(null);
                  }}
                  placeholder="98765 43210"
                  className="w-full bg-transparent pl-3 text-base font-black tracking-wider text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
              {error ? <p className="mt-1 text-[11px] font-bold text-red-600">{error}</p> : null}
            </div>

            {/* Quick Demo Number Button */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Quick Test Number:</span>
              <button
                type="button"
                onClick={() => fillDemoNumber("9876543210")}
                className="font-bold text-amber-800 hover:underline"
              >
                Use 9876543210
              </button>
            </div>

            {/* Submit OTP Button */}
            <button
              type="submit"
              disabled={busy || sent || value.length < 10}
              className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 font-black text-xs uppercase tracking-wider text-zinc-950 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Get OTP & Continue</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>

            {/* Or Google Login */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-zinc-400 uppercase">
                Or Continue With
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleBusy}
              className="flex w-full h-12 items-center justify-center gap-2.5 rounded-2xl border border-zinc-200 bg-white font-bold text-xs text-zinc-800 shadow-xs transition-all active:scale-95 hover:bg-zinc-50"
            >
              {googleBusy ? (
                <Loader2 className="size-4 animate-spin text-zinc-600" />
              ) : (
                <>
                  <GoogleGlyph />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Terms & Security Footer */}
        <div className="bg-zinc-50 p-4 text-center border-t border-zinc-100">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-500">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>End-to-End Secure Store Authentication</span>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP SPLIT BUSINESS CONSOLE AUTH SCREEN (>= md)                        */}
      {/* ========================================================================= */}
      <div className="hidden min-h-screen md:grid md:grid-cols-12">
        {/* Left Column: Brand Showcase Banner (7 cols) */}
        <div className="relative col-span-7 flex flex-col justify-between bg-zinc-950 p-12 lg:p-16 text-white overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 size-96 rounded-full bg-emerald-500/15 blur-3xl" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-400 font-black text-zinc-950 text-xl shadow-lg">
              QP
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">QuickPress</span>
              <span className="ml-2 rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                Partner Console
              </span>
            </div>
          </div>

          {/* Center Showcase Typography & Benefits */}
          <div className="relative z-10 max-w-xl my-auto py-12">
            <h2 className="text-4xl font-black leading-tight tracking-tight lg:text-5xl">
              The all-in-one operating platform for modern laundry stores.
            </h2>
            <p className="mt-4 text-sm font-medium text-zinc-400 leading-relaxed">
              Accept orders, manage live rates, coordinate with logistics riders, and receive weekly direct bank settlements with zero manual paperwork.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {BENEFITS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm"
                >
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
                    <item.icon className="size-4" />
                  </div>
                  <h3 className="mt-2.5 text-xs font-black text-white">{item.title}</h3>
                  <p className="mt-1 text-[11px] font-medium text-zinc-400 leading-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Trust & Compliance */}
          <div className="relative z-10 flex items-center justify-between border-t border-zinc-800/80 pt-6 text-xs text-zinc-400">
            <span>© 2026 QuickPress Technologies Inc.</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="size-3.5" /> 99.9% Uptime SLA
              </span>
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card (5 cols) */}
        <div className="col-span-5 flex flex-col justify-center bg-white p-8 lg:p-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <h3 className="text-2xl font-black tracking-tight text-zinc-900">Partner Sign In</h3>
              <p className="mt-1.5 text-xs font-medium text-zinc-500">
                Enter your mobile number to access your store dashboard.
              </p>
            </div>

            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label
                  htmlFor="mobile-input-desk"
                  className="block text-xs font-black uppercase tracking-wider text-zinc-700"
                >
                  Registered Mobile Number
                </label>
                <div
                  className={`mt-2 flex h-13 items-center rounded-2xl border-2 bg-zinc-50 px-4 transition-all ${
                    error
                      ? "border-red-500 bg-red-50/20"
                      : "border-zinc-200 focus-within:border-zinc-900 focus-within:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5 border-r border-zinc-300 pr-3 text-xs font-black text-zinc-800">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    id="mobile-input-desk"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (error) setError(null);
                    }}
                    placeholder="98765 43210"
                    className="w-full bg-transparent pl-3.5 text-base font-black tracking-wider text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>
                {error ? <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p> : null}
              </div>

              {/* Demo Fill Helper */}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Test Store Account:</span>
                <button
                  type="button"
                  onClick={() => fillDemoNumber("9876543210")}
                  className="font-bold text-amber-800 hover:underline"
                >
                  Fill 98765 43210
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy || sent || value.length < 10}
                className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 font-black text-xs uppercase tracking-wider text-zinc-950 shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP via SMS</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <span className="relative bg-white px-3 text-xs font-bold text-zinc-400 uppercase">
                  Or Sign In With
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleBusy}
                className="flex w-full h-12 items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white font-bold text-xs text-zinc-800 shadow-xs transition-all hover:bg-zinc-50 active:scale-95 cursor-pointer"
              >
                {googleBusy ? (
                  <Loader2 className="size-4 animate-spin text-zinc-600" />
                ) : (
                  <>
                    <GoogleGlyph />
                    <span>Continue with Google Workspace</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 rounded-2xl bg-zinc-50 p-4 border border-zinc-100 text-xs text-zinc-500">
              <p className="font-semibold text-zinc-700">Need help signing into your outlet?</p>
              <p className="mt-0.5">
                Contact your QuickPress Partner Relationship Manager at{" "}
                <a href="tel:18002008899" className="font-bold text-amber-800 hover:underline">
                  1800-200-8899
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
