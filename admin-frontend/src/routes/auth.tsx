import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Fingerprint,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { adminPinLogin, restoreAdminSession } from "../api/auth";
import { adminRoutes } from "../navigation/admin-routes";
import { adminHead } from "../lib/head";

export const Route = createFileRoute("/auth")({
  head: () => adminHead("Admin Passcode Login", "Secure Administrator Console Access · QuickPress"),
  component: AdminAuthPage,
});

export function AdminAuthPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-login: If already authenticated, skip to dashboard
  useEffect(() => {
    let active = true;
    void restoreAdminSession()
      .then((session) => {
        if (active && session) {
          navigate({ to: adminRoutes.dashboard });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [navigate]);

  // Initial focus
  useEffect(() => {
    inputRefs[0]?.current?.focus();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (passcode: string) => {
      return adminPinLogin(passcode);
    },
    onSuccess: () => {
      setIsSuccess(true);
      setErrorMessage(null);
      toast.success("Passcode Verified! Welcome Super Admin.");
      window.setTimeout(() => {
        navigate({ to: adminRoutes.dashboard });
      }, 500);
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Incorrect Admin Passcode (PIN).";
      setErrorMessage(msg);
      toast.error(msg);
      setPin(["", "", "", ""]);
      inputRefs[0]?.current?.focus();
    },
  });

  const handleDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = cleanDigit;
    setPin(newPin);
    setErrorMessage(null);

    if (cleanDigit && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }

    const fullCode = newPin.join("");
    if (fullCode.length === 4 && !newPin.includes("")) {
      loginMutation.mutate(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const newPin = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newPin[i] = pasted[i];
    }
    setPin(newPin);

    if (pasted.length === 4) {
      inputRefs[3]?.current?.focus();
      loginMutation.mutate(pasted);
    } else {
      inputRefs[Math.min(pasted.length, 3)]?.current?.focus();
    }
  };

  const handleKeypadPress = (num: string) => {
    if (loginMutation.isPending || isSuccess) return;
    const firstEmptyIndex = pin.findIndex((d) => d === "");
    if (firstEmptyIndex !== -1) {
      handleDigitChange(firstEmptyIndex, num);
    }
  };

  const handleKeypadBackspace = () => {
    if (loginMutation.isPending || isSuccess) return;
    const lastFilledIndex = [...pin].reverse().findIndex((d) => d !== "");
    if (lastFilledIndex !== -1) {
      const realIndex = 3 - lastFilledIndex;
      const newPin = [...pin];
      newPin[realIndex] = "";
      setPin(newPin);
      inputRefs[realIndex]?.current?.focus();
    }
  };

  const handleKeypadClear = () => {
    setPin(["", "", "", ""]);
    setErrorMessage(null);
    inputRefs[0]?.current?.focus();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const fullCode = pin.join("");
    if (fullCode.length !== 4) {
      setErrorMessage("Please enter all 4 digits of the admin passcode.");
      return;
    }
    loginMutation.mutate(fullCode);
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#FFFBF2] text-[#111827] px-4 py-8 overflow-hidden font-sans">
      {/* Background Dot Ambience */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(#F4B400_0.75px,transparent_0.75px)] opacity-15 [background-size:24px_24px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Top Branding Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <span className="text-[11px] font-black tracking-widest text-emerald-800 uppercase">
              SUPER ADMIN CONSOLE
            </span>
          </div>

          {/* QuickPress Logo */}
          <div className="mt-3 flex items-center justify-center gap-1">
            <span className="text-3xl font-black tracking-tight text-[#111827]">Quick</span>
            <span className="text-3xl font-black tracking-tight text-[#16A34A]">Press</span>
            <div className="ml-2 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900">
              OPERATIONS
            </div>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 font-medium">
            Enter 4-Digit Passcode to Unlock Platform Governance
          </p>
        </div>

        {/* Auth Light Card */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-900 tracking-tight">Security Verification</h2>
                <p className="text-[11px] text-zinc-500 font-medium">Passcode Protected Gateway</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-bold text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              {showPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span>{showPin ? "Mask" : "Show"}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* 4-Digit Inputs */}
            <div>
              <div className="flex justify-center gap-3 sm:gap-4">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    disabled={loginMutation.isPending || isSuccess}
                    className={`size-14 sm:size-16 rounded-2xl border text-center text-2xl font-black transition-all outline-none ${
                      isSuccess
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_15px_rgba(22,163,74,0.2)]"
                        : errorMessage
                        ? "border-rose-400 bg-rose-50 text-rose-700 animate-shake"
                        : digit
                        ? "border-emerald-600 bg-emerald-50/50 text-zinc-900 shadow-sm"
                        : "border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-300 focus:border-emerald-600 focus:bg-white focus:shadow-md"
                    }`}
                  />
                ))}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600">
                  <AlertCircle className="size-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Notification */}
              {isSuccess && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  <span>Passcode Verified · Redirecting to Dashboard...</span>
                </div>
              )}
            </div>

            {/* Onscreen PIN Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={loginMutation.isPending || isSuccess}
                  className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-lg font-black text-zinc-800 transition-all hover:bg-zinc-100 hover:border-zinc-300 active:scale-95 active:bg-zinc-200"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                disabled={loginMutation.isPending || isSuccess}
                className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-800 active:scale-95"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                disabled={loginMutation.isPending || isSuccess}
                className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-lg font-black text-zinc-800 transition-all hover:bg-zinc-100 active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                disabled={loginMutation.isPending || isSuccess}
                className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-800 active:scale-95"
              >
                ⌫
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending || isSuccess || pin.join("").length !== 4}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] py-3.5 text-sm font-black text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Verifying Passcode...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Unlocked</span>
                </>
              ) : (
                <>
                  <span>Unlock Admin Console</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 text-[10px] text-zinc-500 font-medium">
            <div className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-600" />
              <span>Zero-Trust RBAC</span>
            </div>
            <div className="flex items-center gap-1">
              <Fingerprint className="size-3 text-amber-600" />
              <span>256-Bit Encrypted</span>
            </div>
            <div className="flex items-center gap-1">
              <KeyRound className="size-3 text-sky-600" />
              <span>Super Admin PIN</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
