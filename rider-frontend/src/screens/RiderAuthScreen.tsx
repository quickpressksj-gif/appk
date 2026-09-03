import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Coins,
  Globe,
  Loader2,
  Lock,
  Phone,
  Shield,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useRiderContext } from "../context/RiderContext";
import { sendOtp, loginWithGoogle } from "../api/rider/rider-auth-api";
import { RiderAuthHeader } from "../components/RiderAuthHeader";

const BENEFIT_CARDS = [
  {
    icon: Truck,
    title: "Instant Deliveries",
    desc: "Get assigned laundry pickups & deliveries from top local outlets.",
    color: "bg-amber-400/15 text-amber-600",
  },
  {
    icon: Coins,
    title: "High Weekly Earnings",
    desc: "Earn ₹35k+ monthly with guaranteed per-km rates & customer tips.",
    color: "bg-emerald-500/15 text-emerald-600",
  },
  {
    icon: Zap,
    title: "Flexible Work Hours",
    desc: "Choose when you want to work. One-tap Online/Offline duty switch.",
    color: "bg-blue-500/15 text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Smart Radar Dispatch",
    desc: "Automated GPS dispatch with instant audio siren notifications.",
    color: "bg-purple-500/15 text-purple-600",
  },
];

const REMEMBER_KEY = "qp.rider.rememberedPhone";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4.5 shrink-0">
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

export function RiderAuthScreen() {
  const navigate = useNavigate();
  const { setPhone, signIn, session, hydrating } = useRiderContext();

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");

  // Redirect if already authenticated
  useEffect(() => {
    if (hydrating || !session) return;
    navigate({ to: "/dashboard" });
  }, [hydrating, session, navigate]);

  // Restore remembered phone number
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

    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length !== 10) {
      const msg = "Please enter a valid 10-digit mobile number.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setError(null);
    setBusy(true);

    if (remember) window.localStorage.setItem(REMEMBER_KEY, digits);
    else window.localStorage.removeItem(REMEMBER_KEY);

    try {
      await sendOtp(digits).catch(() => true);
      setPhone(digits);
      setSent(true);
      toast.success("Verification code sent to your phone");
      window.setTimeout(() => navigate({ to: "/otp" }), 500);
    } catch (cause) {
      const msg =
        cause instanceof Error ? cause.message : "Unable to connect to server. Please try again.";
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
      navigate({ to: "/dashboard" });
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Google Sign In was cancelled or failed",
      );
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col justify-between font-sans selection:bg-[#F4B400]/30">
      {/* Background Ambience / Clean Modern Glow */}
      <div className="pointer-events-none fixed -top-32 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-emerald-600/5 blur-3xl" />

      {/* ========================================================================= */}
      {/* MOBILE EXPERIENCE (< 1024px)                                              */}
      {/* ========================================================================= */}
      <div className="relative flex flex-col justify-between min-h-screen p-4 sm:p-6 lg:hidden max-w-md mx-auto w-full">
        {/* Top Header with Brand Wordmark */}
        <div className="pt-2 flex flex-col items-center">
          <div className="w-full flex justify-end mb-1">
            {/* Language Selector */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200/90 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-zinc-700 shadow-2xs active:scale-95 transition-all backdrop-blur-xs cursor-pointer"
            >
              <Globe className="size-3.5 text-zinc-500" />
              <span>{lang === "en" ? "English" : "हिंदी"}</span>
            </button>
          </div>

          <RiderAuthHeader badge="CAPTAIN" withTagline={true} />
        </div>

        {/* Mobile Login Card Container */}
        <div className="my-auto py-4">
          <div className="rounded-3xl border border-zinc-200/80 bg-white/95 backdrop-blur-md p-6 sm:p-7 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.07)]">
            {/* Card Title */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-black text-amber-900 border border-amber-200/80 mb-2">
                <Sparkles className="size-3 text-amber-600" />
                <span>CAPTAIN FLEET PORTAL</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#111827]">
                Welcome Back 👋
              </h2>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                Log in to accept pickup &amp; delivery tasks, track trips and earnings.
              </p>
            </div>

            {/* Mobile Form */}
            <form onSubmit={handleContinue} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="mobile-input-mob"
                  className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-1.5"
                >
                  Mobile Number
                </label>
                <div
                  className={`flex h-[54px] items-center rounded-2xl border-2 bg-zinc-50/90 px-3.5 transition-all ${
                    error
                      ? "border-red-500 bg-red-50/20"
                      : "border-zinc-200 focus-within:border-[#111827] focus-within:bg-white focus-within:shadow-sm"
                  }`}
                >
                  <span className="flex items-center gap-1.5 border-r border-zinc-200 pr-3 text-xs font-black text-[#111827]">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    id="mobile-input-mob"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (error) setError(null);
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full bg-transparent pl-3 text-base font-black tracking-wider text-[#111827] placeholder:text-zinc-400 placeholder:font-medium placeholder:text-xs focus:outline-none"
                    autoFocus
                  />
                </div>
                {error ? (
                  <p className="mt-1.5 text-xs font-bold text-red-600 animate-in fade-in duration-200">
                    {error}
                  </p>
                ) : null}
              </div>

              {/* Remember checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded-md border-zinc-300 text-[#111827] focus:ring-0"
                />
                <span className="text-xs font-semibold text-zinc-600">
                  Keep me logged in on this device
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy || sent || value.replace(/\D/g, "").length !== 10}
                className="btn-ripple relative flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] text-sm font-black tracking-wide text-white shadow-md hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4.5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Mobile</span>
                    <ArrowRight className="size-4.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 font-bold text-zinc-400 text-[10px] tracking-wider">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleBusy}
              className="flex h-[48px] w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-zinc-200 bg-white font-bold text-xs text-zinc-800 shadow-2xs hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              {googleBusy ? (
                <Loader2 className="size-4 animate-spin text-zinc-500" />
              ) : (
                <>
                  <GoogleGlyph />
                  <span>Sign In with Google</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info & Trust Badge */}
        <div className="space-y-3 pb-2 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
            <Shield className="size-3.5 text-emerald-600" />
            <span>100% Secure · 256-bit Encryption · Verified Captains</span>
          </div>
          <p className="text-[11px] text-zinc-400">QuickPress Captain © 2024</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP EXPERIENCE (>= 1024px) — Side-by-Side Pro Console (Partner style) */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid lg:min-h-screen lg:grid-cols-2 max-w-7xl mx-auto w-full p-8 gap-8 items-center">
        {/* Left Column: Brand & Value Showcase */}
        <div className="space-y-8 pr-8">
          <div>
            <RiderAuthHeader badge="CAPTAIN" withTagline={true} />
            <div className="mt-8 space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-950">
                Delivery Captain Portal
              </h1>
              <p className="text-sm font-medium text-slate-600 max-w-md">
                Join India&apos;s fastest growing laundry logistics network. Manage pickups, deliveries, and instant payouts.
              </p>
            </div>
          </div>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {BENEFIT_CARDS.map((card, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200/70 bg-zinc-50/50 p-4 space-y-2 hover:bg-white hover:border-zinc-300 transition-all shadow-2xs"
              >
                <div
                  className={`flex size-9 items-center justify-center rounded-xl ${card.color}`}
                >
                  <card.icon className="size-5" />
                </div>
                <h3 className="text-xs font-black text-zinc-900">{card.title}</h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Desktop Card Form */}
        <div className="max-w-md w-full mx-auto">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-900 border border-amber-200 mb-2">
                <Sparkles className="size-3 text-amber-600" />
                <span>CAPTAIN BUSINESS PORTAL</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Welcome Back 👋
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your mobile number to receive verification code.
              </p>
            </div>

            <form onSubmit={handleContinue} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="flex h-[54px] items-center rounded-2xl border-2 border-zinc-200 bg-zinc-50/90 px-3.5 focus-within:border-black focus-within:bg-white">
                  <span className="flex items-center gap-1.5 border-r border-zinc-200 pr-3 text-xs font-black text-[#111827]">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Enter mobile number"
                    className="w-full bg-transparent pl-3 text-sm font-black text-slate-950 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || value.replace(/\D/g, "").length !== 10}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] text-sm font-black text-white hover:bg-black active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {busy ? (
                  <Loader2 className="size-4.5 animate-spin" />
                ) : (
                  <>
                    <span>Continue to Dashboard</span>
                    <ArrowRight className="size-4.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
