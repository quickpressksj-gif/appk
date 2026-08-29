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
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { riderRoutes } from "../navigation/rider-routes";
import { checkRiderVerificationStatus, fetchOnboardingStatus } from "@/api/rider/rider-auth-api";
import { useRiderContext } from "../context/RiderContext";
import { apiPostJson } from "@/api/core/transport";

const TIMELINE = [
  { icon: BadgeCheck, title: "Application Submitted", body: "Personal, vehicle and bank details recorded.", status: "completed" },
  { icon: FileSearch, title: "Document & KYC Check", body: "Aadhaar, PAN, DL and RC verified against registries.", status: "completed" },
  { icon: ShieldCheck, title: "Operations Admin Approval", body: "Final review and active Captain role assignment.", status: "in_progress" },
  { icon: Clock3, title: "Captain Dashboard & Live Orders", body: "Go online to start receiving delivery tasks.", status: "pending" },
];

export function RiderRegistrationSubmittedScreen() {
  const navigate = useNavigate();
  const { session, signIn } = useRiderContext();
  const [checking, setChecking] = useState(false);
  const [isApprovingTest, setIsApprovingTest] = useState(false);

  const checkStatus = async (silent: boolean = false) => {
    if (checking) return;
    setChecking(true);
    try {
      const isApproved = await checkRiderVerificationStatus(session?.account?.linkedId || "");
      if (isApproved) {
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
        toast.success("🎉 Congratulations! Your Captain account has been APPROVED!");
        navigate({ to: riderRoutes.dashboard });
      } else {
        if (!silent) {
          toast.info("Your Captain application is currently under Operations Review. Please check back shortly!");
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

  // Initial check & continuous polling every 4 seconds
  useEffect(() => {
    void checkStatus(true);
    const interval = setInterval(() => {
      void checkStatus(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Quick test approve button for demonstration & rapid testing
  const handleTestApprove = async () => {
    setIsApprovingTest(true);
    try {
      const riderId = session?.account?.linkedId || session?.account?.id || "";
      if (riderId) {
        await apiPostJson(`/api/admin/riders/${riderId}/approve`, {}).catch(() => null);
      }
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
      toast.success("🎉 Rider account APPROVED! Redirecting to Dashboard...");
      setTimeout(() => navigate({ to: riderRoutes.dashboard }), 500);
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    } finally {
      setIsApprovingTest(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Toaster position="top-center" richColors />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 pb-12 pt-12 lg:max-w-2xl">
        <div className="animate-slide-up text-center">
          <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-soft">
            <BadgeCheck className="size-11" strokeWidth={2.2} />
          </span>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-foreground">
            Application Under Review
          </h1>
          <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground max-w-sm mx-auto">
            Thanks for registering with QuickPress! Your Rapido-style delivery partner profile and documents have been safely saved to the database and sent to Admin for verification.
          </p>
        </div>

        <section className="mt-6 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[0.66rem] font-black uppercase tracking-widest text-muted-foreground">
              Verification Pipeline
            </p>
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-amber-600 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
              Live Sync
            </span>
          </div>

          <ol className="mt-4 space-y-3.5">
            {TIMELINE.map((item) => {
              const isDone = item.status === "completed";
              const isInProgress = item.status === "in_progress";
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-3.5 items-start">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : isInProgress
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-2 ring-amber-400/40"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-5" strokeWidth={2.5} />
                    ) : isInProgress ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      {isDone && (
                        <span className="text-[0.65rem] font-bold text-emerald-600 dark:text-emerald-400">
                          Verified ✓
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[0.65rem] font-bold text-amber-600 dark:text-amber-400">
                          In Review ⏳
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[0.72rem] text-muted-foreground leading-snug">{item.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void checkStatus(false)}
            disabled={checking}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-xs font-black text-black shadow-lg shadow-amber-400/20 transition-transform active:scale-[0.98] hover:bg-amber-300 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
            <span>Check Approval Status</span>
          </button>

          <button
            type="button"
            onClick={handleTestApprove}
            disabled={isApprovingTest}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
          >
            {isApprovingTest ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4 fill-current" />}
            <span>Test Instant Admin Approval (Bypass)</span>
          </button>
        </div>

        <p className="mt-6 text-center text-[0.7rem] text-muted-foreground">
          Need help with your registration? Contact partner support at{" "}
          <span className="font-semibold text-foreground">support@quickpress.online</span>
        </p>
      </div>
    </main>
  );
}
