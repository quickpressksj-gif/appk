import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { QuickPressCaptainLogo } from "../components/QuickPressCaptainLogo";
import { sendOtp } from "../api/rider/rider-auth-api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login — QuickPress Captain" },
      {
        name: "description",
        content: "Login to start accepting QuickPress laundry orders as a delivery partner.",
      },
    ],
  }),
  component: CaptainLoginScreen,
});

function CaptainLoginScreen() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanDigits = mobile.replace(/\D/g, "");
  const isValidPhone = cleanDigits.length === 10;

  const handleContinue = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidPhone || busy) return;

    setBusy(true);
    setError(null);

    try {
      // Send OTP via backend
      await sendOtp(cleanDigits).catch(() => {
        // Fallback for offline / dev mode
        return true;
      });

      // Persist pending phone for OTP verification screen
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("qp.rider.pendingPhone", cleanDigits);
        window.localStorage.setItem("qp.rider.pendingPhone", cleanDigits);
      }

      void navigate({ to: "/otp" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-dvh bg-white text-slate-900 flex flex-col justify-between px-5 py-6 max-w-md mx-auto selection:bg-emerald-500 selection:text-white">
      {/* Top Section: Brand Identity & Welcome Heading */}
      <section className="pt-6 sm:pt-10 text-center">
        {/* QuickPress Captain Logo Lockup */}
        <QuickPressCaptainLogo variant="stacked" size="md" />

        {/* Welcome Text */}
        <div className="mt-6 space-y-1">
          <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-950">
            Welcome, Captain
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            Login to start accepting QuickPress orders
          </p>
        </div>
      </section>

      {/* Middle Section: Mobile Number Form */}
      <section className="w-full my-auto py-6">
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label
              htmlFor="mobile-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Mobile Number
            </label>

            <div className="relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition-all focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-2xs">
              <span className="font-bold text-sm text-slate-900 border-r border-slate-200 pr-3 mr-3 select-none">
                +91
              </span>
              <input
                id="mobile-input"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  setError(null);
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                }}
                placeholder="Enter mobile number"
                className="w-full bg-transparent text-sm font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden"
                autoFocus
              />
              <Phone className="size-4 text-slate-400 shrink-0 ml-2" />
            </div>

            {error ? (
              <p className="mt-1.5 text-xs font-semibold text-rose-600">
                {error}
              </p>
            ) : null}
          </div>

          {/* Primary CTA Button */}
          <button
            type="submit"
            disabled={!isValidPhone || busy}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          {/* Legal / Terms Disclaimer */}
          <p className="text-[11px] text-center text-slate-400 font-medium pt-1">
            By continuing, you agree to our{" "}
            <span className="text-slate-600 underline cursor-pointer">Terms</span> &amp;{" "}
            <span className="text-slate-600 underline cursor-pointer">Privacy Policy</span>
          </p>
        </form>
      </section>

      {/* Bottom Section: Highlights & Footer */}
      <footer className="space-y-5 pt-4">
        {/* Value Proposition Cards (Figma style) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-left">
            <p className="text-base font-black text-slate-950 tracking-tight">
              ₹35k+
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Weekly Payouts
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-left">
            <p className="text-base font-black text-slate-950 tracking-tight">
              Flexible
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Choose Work Hours
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-[11px] font-medium text-slate-400 text-center pb-2">
          QuickPress © 2024
        </p>
      </footer>
    </main>
  );
}
