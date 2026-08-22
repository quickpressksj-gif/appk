import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  MessageSquareLock,
  Smartphone,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  fetchCountries,
  loginWithApple,
  loginWithGoogle,
  rememberCustomerLogin,
  requestOtp,
  restoreCustomerSession,
  type Country,
} from "@/api/customer/auth-api";
import { verifyCustomerOtp } from "@/lib/customer-auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "QuickPress — Sign in with your mobile number" },
      {
        name: "description",
        content:
          "One secure step to enter QuickPress laundry pickup and delivery. Verify your mobile number with OTP — no password, no email.",
      },
      { property: "og:title", content: "QuickPress — Sign in with your mobile number" },
      {
        property: "og:description",
        content: "Verify your mobile number with OTP to enter QuickPress. No password required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthScreen,
});

const FALLBACK_COUNTRY: Country = { code: "+91", label: "IN", digits: 10 };

/** Typographic brand lockup — wordmark instead of a logo mark. */
function BrandHeader() {
  return (
    <div className="flex flex-col items-center px-6 pt-[max(2.25rem,env(safe-area-inset-top))]">
      <div className="auth-logo-in auth-logo-float">
        <h1 className="auth-wordmark text-[2.75rem] font-black leading-none tracking-[-0.05em] sm:text-[3.25rem]">
          <span className="text-brand-dark">Quick</span>
          <span className="text-brand-green">Press</span>
        </h1>
      </div>

      <span className="auth-rise relative mt-3 block h-[3px] w-28 overflow-hidden rounded-full bg-primary/15 [animation-delay:80ms]">
        <span className="brand-sweep absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
      </span>

      <p className="auth-rise mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground [animation-delay:140ms]">
        Laundry <span className="text-primary">·</span> Pickup{" "}
        <span className="text-primary">·</span> Delivery
      </p>

      {/* Flowing wave ribbon + rising bubbles under the tagline */}
      <div
        className="auth-rise relative mt-5 h-16 w-full max-w-xs overflow-hidden [animation-delay:200ms]"
        aria-hidden
      >
        <svg
          className="auth-flow-wave absolute inset-y-0 left-0 h-full"
          viewBox="0 0 240 40"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 24 Q 15 10 30 24 T 60 24 T 90 24 T 120 24 T 150 24 T 180 24 T 210 24 T 240 24"
            stroke="var(--color-brand-green)"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M0 32 Q 15 20 30 32 T 60 32 T 90 32 T 120 32 T 150 32 T 180 32 T 210 32 T 240 32"
            stroke="var(--color-primary)"
            strokeOpacity="0.3"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <span className="auth-flow-bubble absolute bottom-3 left-[18%] size-2 rounded-full bg-brand-green/60" />
        <span className="auth-flow-bubble absolute bottom-2 left-[46%] size-1.5 rounded-full bg-primary/60 [animation-delay:600ms]" />
        <span className="auth-flow-bubble absolute bottom-4 left-[72%] size-2.5 rounded-full bg-brand-green/40 [animation-delay:1200ms]" />
      </div>
    </div>
  );
}

function AuthScreen() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountry] = useState<Country>(FALLBACK_COUNTRY);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTarget = search?.redirect && search.redirect !== "/login" ? search.redirect : undefined;

  // GET /api/countries
  useEffect(() => {
    let alive = true;
    void fetchCountries().then((list) => {
      if (!alive || list.length === 0) return;
      setCountries(list);
      setCountry((prev) => list.find((item) => item.code === prev.code) ?? list[0]!);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="relative flex min-h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(120%_70%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_26%,transparent),transparent_70%)]" />

      <div className="relative flex w-full flex-1 flex-col">
        <div className="flex justify-end px-5 pt-[max(0.9rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => void navigate({ to: "/home" })}
            className="min-h-11 rounded-full px-4 text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
        </div>

        <BrandHeader />

        <div className="mx-auto mt-auto flex w-full max-w-md flex-col justify-end px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
          <section
            key={step}
            className="auth-card rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.35)] sm:p-6"
          >
            {step === "phone" ? (
              <PhoneStep
                countries={countries.length > 0 ? countries : [country]}
                country={country}
                setCountry={setCountry}
                phone={phone}
                setPhone={setPhone}
                sending={sending}
                redirectTarget={redirectTarget}
                onContinue={() => {
                  setSending(true);
                  // POST /api/auth/request-otp
                  void requestOtp(`${country.code}${phone}`)
                    .catch(() => undefined)
                    .finally(() => {
                      setSending(false);
                      setStep("otp");
                    });
                }}
              />
            ) : (
              <OtpStep
                phone={`${country.code}${phone}`}
                fullNumber={`${country.code} ${phone}`}
                redirectTarget={redirectTarget}
                onEdit={() => setStep("phone")}
              />
            )}
          </section>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0 text-brand-green" aria-hidden />
            Secured with bank-grade OTP verification
          </p>
        </div>
      </div>
    </main>
  );
}

function PhoneStep({
  countries,
  country,
  setCountry,
  phone,
  setPhone,
  sending,
  redirectTarget,
  onContinue,
}: {
  countries: Country[];
  country: Country;
  setCountry: (c: Country) => void;
  phone: string;
  setPhone: (v: string) => void;
  sending: boolean;
  redirectTarget?: string;
  onContinue: () => void;
}) {
  const valid = phone.length === country.digits;
  const navigate = useNavigate();
  const [social, setSocial] = useState<"google" | "apple" | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const invalid = touched && phone.length > 0 && !valid;

  // Auto login: Firebase user + stored QuickPress JWT → straight to home or redirect target.
  useEffect(() => {
    let active = true;
    void restoreCustomerSession()
      .then((restored) => {
        if (active && restored) {
          if (redirectTarget) {
            void navigate({ to: redirectTarget as any });
          } else {
            void navigate({ to: "/home" });
          }
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [navigate, redirectTarget]);

  /** Firebase social sign in → FastAPI exchange → QuickPress JWT session. */
  const signInWithProvider = async (provider: "google" | "apple") => {
    const label = provider === "google" ? "Google" : "Apple";
    setSocialError(null);
    setSocial(provider);
    try {
      rememberCustomerLogin(true);
      await (provider === "google" ? loginWithGoogle() : loginWithApple());
      if (redirectTarget) {
        void navigate({ to: redirectTarget as any });
      } else {
        void navigate({ to: "/location" });
      }
    } catch (cause) {
      setSocialError(
        cause instanceof Error && cause.message
          ? cause.message
          : `${label} sign-in complete nahi hua. Dobara try karein.`,
      );
      setSocial(null);
    }
  };

  return (
    <div>
      <h2 className="auth-rise text-[1.6rem] font-black leading-tight tracking-[-0.03em] text-foreground">
        Welcome Back <span aria-hidden>👋</span>
      </h2>
      <p className="auth-rise mt-1.5 text-[13.5px] font-medium text-muted-foreground [animation-delay:60ms]">
        Continue with your mobile number
      </p>

      <form
        className="auth-rise mt-6 [animation-delay:120ms]"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (valid && !sending) onContinue();
        }}
      >
        <label
          htmlFor="qp-phone"
          className="mb-2 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
        >
          Mobile number
        </label>

        <div
          className={`auth-field flex h-14 items-center overflow-hidden rounded-2xl border-2 bg-background ${
            invalid ? "input-invalid" : "border-border"
          }`}
        >
          <div className="relative flex h-full items-center border-r border-border pl-3.5">
            <Smartphone
              className="pointer-events-none size-[18px] shrink-0 text-muted-foreground"
              aria-hidden
            />
            <select
              aria-label="Country code"
              value={country.code}
              onChange={(event) => {
                const next = countries.find((c) => c.code === event.target.value);
                if (next) {
                  setCountry(next);
                  setPhone("");
                }
              }}
              className="h-full appearance-none bg-transparent pl-2 pr-7 text-[15px] font-bold text-foreground outline-none"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 size-4 text-muted-foreground"
              aria-hidden
            />
          </div>

          <input
            id="qp-phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="tel"
            autoFocus
            placeholder="00000 00000"
            aria-invalid={invalid}
            aria-describedby="qp-phone-hint"
            value={phone}
            onBlur={() => setTouched(true)}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, "").slice(0, country.digits))
            }
            className="h-full min-w-0 flex-1 bg-transparent px-4 text-[17px] font-bold tracking-[0.06em] text-foreground outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-muted-foreground/60"
          />

          {valid ? (
            <span className="mr-4 grid size-6 shrink-0 place-items-center rounded-full bg-brand-green auth-pop">
              <Check className="size-3.5 text-background" aria-hidden />
            </span>
          ) : null}
        </div>

        <p
          id="qp-phone-hint"
          className={`mt-2 text-[12px] font-medium ${invalid ? "text-destructive" : "text-muted-foreground"}`}
          role={invalid ? "alert" : undefined}
        >
          {invalid
            ? `Enter a valid ${country.digits}-digit number`
            : `We'll send a ${6}-digit code to verify it's you`}
        </p>

        <button
          type="submit"
          disabled={!valid || sending}
          className="btn-ripple mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15.5px] font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
        >
          {sending ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Sending OTP…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="size-[18px]" aria-hidden />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={social !== null}
          onClick={() => void signInWithProvider("google")}
          className="flex h-13 min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card text-sm font-bold text-foreground transition-all duration-300 active:scale-[0.985] disabled:opacity-60"
        >
          {social === "google" ? (
            <Loader2 className="size-[18px] animate-spin" aria-hidden />
          ) : (
            <GoogleIcon />
          )}
          Google
        </button>
        <button
          type="button"
          disabled={social !== null}
          onClick={() => void signInWithProvider("apple")}
          className="flex h-13 min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card text-sm font-bold text-foreground transition-all duration-300 active:scale-[0.985] disabled:opacity-60"
        >
          {social === "apple" ? (
            <Loader2 className="size-[18px] animate-spin" aria-hidden />
          ) : (
            <AppleIcon />
          )}
          Apple
        </button>
      </div>

      {socialError ? (
        <p
          className="animate-shake mt-3 text-center text-xs font-semibold text-destructive"
          role="alert"
        >
          {socialError}
        </p>
      ) : null}

      <p className="mt-6 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        By continuing, you agree to our{" "}
        <span className="font-bold text-foreground">Terms of Service</span> &{" "}
        <span className="font-bold text-foreground">Privacy Policy</span>
      </p>
    </div>
  );
}

function OtpStep({
  phone,
  fullNumber,
  redirectTarget,
  onEdit,
}: {
  phone: string;
  fullNumber: string;
  redirectTarget?: string;
  onEdit: () => void;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    inputs.current[0]?.focus();
    // Home chunk pehle se load kar lo taaki verify ke baad flash na ho.
    void router.preloadRoute({ to: "/location" });
  }, [router]);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const fill = (value: string, index: number) => {
    const chars = value.replace(/\D/g, "").split("");
    if (chars.length === 0) return;
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((char, offset) => {
        if (index + offset < 6) next[index + offset] = char;
      });
      return next;
    });
    const focusAt = Math.min(index + chars.length, 5);
    inputs.current[focusAt]?.focus();
  };

  const verify = () => {
    if (code.length !== 6 || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    // POST /api/auth/phone/verify — Firebase ID token → QuickPress JWT pair.
    void Promise.all([
      verifyCustomerOtp(phone, code),
      router.preloadRoute({ to: "/location" }).catch(() => undefined),
    ])
      .then(() => {
        setVerified(true);
        window.setTimeout(() => {
          if (redirectTarget) {
            void navigate({ to: redirectTarget as any });
          } else {
            void navigate({ to: "/location" });
          }
        }, 550);
      })
      .catch((cause: unknown) => {
        setVerifying(false);
        setDigits(Array(6).fill(""));
        inputs.current[0]?.focus();
        setVerifyError(
          cause instanceof Error && cause.message
            ? cause.message
            : "That OTP is incorrect. Please try again.",
        );
      });
  };

  // Blinkit-style: 6 digits complete hote hi auto verify.
  useEffect(() => {
    if (code.length === 6 && !verifying) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Change mobile number"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground active:scale-95"
        >
          <ArrowLeft className="size-[18px]" aria-hidden />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-[1.25rem] font-black tracking-[-0.02em] text-foreground">
            Verify your number
          </h2>
          <p className="truncate text-[12.5px] font-medium text-muted-foreground">
            Code sent to <span className="font-bold text-foreground">{fullNumber}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-3">
        <MessageSquareLock className="size-[18px] shrink-0 text-brand-green" aria-hidden />
        <p className="text-[12.5px] font-medium text-muted-foreground">
          Enter the 6-digit code from your SMS
        </p>
      </div>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          verify();
        }}
      >
        <div className={`flex justify-between gap-2 ${verified ? "otp-success" : ""}`}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputs.current[index] = element;
              }}
              value={digit}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={6}
              aria-label={`Digit ${index + 1}`}
              onChange={(event) => fill(event.target.value, index)}
              onKeyDown={(event) => {
                if (event.key === "Backspace") {
                  event.preventDefault();
                  setDigits((prev) => {
                    const next = [...prev];
                    if (next[index]) next[index] = "";
                    else if (index > 0) next[index - 1] = "";
                    return next;
                  });
                  if (!digit && index > 0) inputs.current[index - 1]?.focus();
                }
                if (event.key === "ArrowLeft") inputs.current[index - 1]?.focus();
                if (event.key === "ArrowRight") inputs.current[index + 1]?.focus();
              }}
              className={`h-14 w-full rounded-xl border-2 bg-background text-center text-[20px] font-black text-foreground outline-none transition-all ${
                verified
                  ? "border-brand-green text-brand-green"
                  : digit
                    ? "border-foreground/70"
                    : "border-border"
              }`}
            />
          ))}
        </div>

        {verifyError ? (
          <p
            className="animate-shake mt-3 text-center text-xs font-semibold text-destructive"
            role="alert"
          >
            {verifyError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={code.length !== 6 || verifying}
          className={`btn-ripple mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15.5px] font-black tracking-tight shadow-cta transition-all duration-300 active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none ${
            verified ? "bg-brand-green text-background" : "bg-primary text-primary-foreground"
          }`}
        >
          {verified ? (
            <>
              <Check className="size-5 auth-pop" aria-hidden />
              Verified
            </>
          ) : verifying ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Verifying…
            </>
          ) : (
            <>
              Verify &amp; Continue
              <ArrowRight className="size-[18px]" aria-hidden />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-muted-foreground">
          {seconds > 0 ? (
            <>
              <Timer className="size-4 shrink-0" aria-hidden />
              <span aria-live="polite">
                Resend OTP in{" "}
                <span className="font-black text-foreground">
                  0:{seconds.toString().padStart(2, "0")}
                </span>
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setSeconds(30)}
              className="min-h-11 px-3 font-black text-brand-green"
            >
              Resend OTP
            </button>
          )}
        </div>
      </form>

      <button
        type="button"
        onClick={onEdit}
        className="mt-2 min-h-11 w-full text-center text-[12.5px] font-bold text-foreground underline underline-offset-4"
      >
        Change mobile number
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.59-5.17 3.59-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3a7.2 7.2 0 0 1-10.72-3.78H1.32v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.34 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.32a12 12 0 0 0 0 10.8l4.02-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.32 6.6l4.02 3.1A7.2 7.2 0 0 1 12 4.75Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
      <path
        fill="currentColor"
        d="M16.36 12.72c.02 2.6 2.28 3.47 2.31 3.48-.02.06-.36 1.24-1.2 2.46-.72 1.05-1.47 2.1-2.66 2.12-1.16.02-1.54-.69-2.87-.69-1.33 0-1.75.67-2.85.71-1.14.04-2.01-1.12-2.74-2.17-1.6-2.3-2.82-6.5-1.18-9.35.81-1.41 2.27-2.31 3.85-2.33 1.12-.02 2.18.75 2.87.75.69 0 1.98-.93 3.34-.79.57.02 2.17.21 3.19 1.71-.08.05-1.87 1.1-1.86 3.29ZM14.3 3.9c.61-.74 1.02-1.77.91-2.8-.88.04-1.95.59-2.58 1.33-.57.65-1.05 1.7-.92 2.7.98.08 1.98-.5 2.59-1.23Z"
      />
    </svg>
  );
}
