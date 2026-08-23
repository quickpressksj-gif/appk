import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileSearch,
  LifeBuoy,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { riderRoutes } from "../navigation/rider-routes";
import { checkRiderVerificationStatus } from "@/api/rider/rider-auth-api";
import { useRiderContext } from "../context/RiderContext";

const TIMELINE = [
  { icon: BadgeCheck, title: "Application received", body: "Your profile details are safely submitted.", done: true },
  { icon: FileSearch, title: "Operations review", body: "Admin inspects KYC and vehicle RC.", done: true },
  { icon: ShieldCheck, title: "Admin approval", body: "Account activated by Super Admin.", done: false },
  { icon: Clock3, title: "Live delivery dispatch", body: "You can go online and receive pickup tasks.", done: false },
];

export function RiderRegistrationSubmittedScreen() {
  const navigate = useNavigate();
  const { session, signIn } = useRiderContext();
  const [checking, setChecking] = useState(false);

  const checkStatus = async (silent: boolean = false) => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await checkRiderVerificationStatus();
      if (res.isVerified) {
        if (session && session.account) {
          signIn({
            ...session,
            isVerified: true,
            isOnboarded: true,
            account: {
              ...session.account,
              isVerified: true,
              isOnboarded: true,
            },
          });
        }
        toast.success("🎉 Congratulations! Your rider account has been approved by Admin!");
        navigate({ to: riderRoutes.dashboard });
      } else {
        if (!silent) {
          toast.info("Your application is currently under Admin Review. Please check back shortly!");
        }
      }
    } catch {
      if (!silent) {
        toast.info("Application is pending admin verification.");
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void checkStatus(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 pb-12 pt-12 lg:max-w-2xl">
        <div className="animate-slide-up text-center">
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-secondary/20 text-brand-green shadow-soft">
            <BadgeCheck className="size-10" strokeWidth={2.2} />
          </span>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-foreground">
            Application Submitted
          </h1>
          <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground max-w-sm mx-auto">
            Thanks for applying as a QuickPress delivery partner. Your profile is waiting for Operations Admin verification.
          </p>
        </div>

        <section className="card-soft animate-rise mt-6 border border-border p-4 bg-card">
          <p className="text-[0.66rem] font-black uppercase tracking-widest text-muted-foreground">
            Onboarding Progress
          </p>
          <ol className="mt-3 space-y-3">
            {TIMELINE.map((item, idx) => (
              <li key={item.title} className="flex gap-3 items-center">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${
                    item.done
                      ? "bg-secondary/20 text-brand-green"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-tight text-foreground">{item.title}</p>
                  <p className="text-[0.68rem] font-medium text-muted-foreground">{item.body}</p>
                </div>
                {item.done ? (
                  <CheckCircle2 className="size-4 text-brand-green shrink-0" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={checking}
            onClick={() => void checkStatus(false)}
            className="ripple flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-xs font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
          >
            {checking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Check Verification Status
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: riderRoutes.auth })}
            className="ripple flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-xs font-bold tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
          >
            Back to Sign In
          </button>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
