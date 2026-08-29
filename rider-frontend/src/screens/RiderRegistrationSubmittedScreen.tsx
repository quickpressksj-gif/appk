import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Copy,
  FileSearch,
  Headphones,
  HelpCircle,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { riderRoutes } from "../navigation/rider-routes";
import { checkRiderVerificationStatus } from "@/api/rider/rider-auth-api";
import { useRiderContext } from "../context/RiderContext";

const TIMELINE = [
  {
    icon: BadgeCheck,
    title: "Application Submitted",
    body: "Personal, vehicle, and bank details recorded.",
    status: "completed",
  },
  {
    icon: FileSearch,
    title: "Document & KYC Check",
    body: "Aadhaar, PAN, DL, and RC verified against registries.",
    status: "completed",
  },
  {
    icon: ShieldCheck,
    title: "Operations Admin Approval",
    body: "Final review and active Captain role assignment.",
    status: "in_progress",
  },
  {
    icon: Clock3,
    title: "Captain Dashboard & Live Orders",
    body: "Go online to start receiving delivery tasks.",
    status: "pending",
  },
];

export function RiderRegistrationSubmittedScreen() {
  const navigate = useNavigate();
  const { session, signIn } = useRiderContext();
  const [checking, setChecking] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Generate deterministic Application ID based on rider identity / mobile / account
  const applicationId = useMemo(() => {
    const rawSeed =
      session?.account?.linkedId ||
      session?.account?.id ||
      session?.phone ||
      "CAPTAIN_DEFAULT";
    const hash = Math.abs(
      rawSeed
        .split("")
        .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0) % 90000
    ) + 10000;
    return `QP-CAP-${hash}`;
  }, [session]);

  const checkStatus = async (silent: boolean = false) => {
    if (checking) return;
    setChecking(true);
    try {
      const isApproved = await checkRiderVerificationStatus(
        session?.account?.linkedId || session?.account?.id || ""
      );
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
          toast.info(
            "Your Captain application is currently under Operations Review. Please check back shortly!"
          );
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

  // Initial check & continuous polling every 5 seconds
  useEffect(() => {
    void checkStatus(true);
    const interval = setInterval(() => {
      void checkStatus(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyApplicationId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(applicationId);
      toast.success("Application ID copied to clipboard!");
    }
  };

  const openWhatsAppSupport = () => {
    const text = encodeURIComponent(
      `Hello QuickPress Support, I have submitted my Captain onboarding application. My Application ID is: ${applicationId}. Please assist with verification.`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50/50 text-slate-900">
      <Toaster position="top-center" richColors />
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 pb-10 pt-10 lg:max-w-2xl">
        {/* Top Header */}
        <div>
          <div className="animate-slide-up text-center">
            <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-600 shadow-sm border border-amber-200 ring-8 ring-amber-500/10">
              <BadgeCheck className="size-11" strokeWidth={2.2} />
            </span>
            <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
              Application Under Review
            </h1>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 max-w-sm mx-auto">
              Thank you for registering as a QuickPress Captain! Your profile and verified documents have been submitted to Operations Admin for activation.
            </p>
          </div>

          {/* Generated Application ID Card */}
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Application Reference ID
                </p>
                <p className="mt-0.5 font-mono text-lg font-black tracking-wide text-slate-900">
                  {applicationId}
                </p>
              </div>
              <button
                type="button"
                onClick={copyApplicationId}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Copy className="size-3.5" />
                <span>Copy ID</span>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-slate-500">
              <span>Expected Review Time</span>
              <span className="font-bold text-amber-600">Within 2 to 4 Hours</span>
            </div>
          </div>

          {/* Verification Pipeline Stepper */}
          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Verification Pipeline
              </p>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
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
                      className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors shadow-xs ${
                        isDone
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : isInProgress
                            ? "bg-amber-50 text-amber-600 border border-amber-300 ring-2 ring-amber-400/30"
                            : "bg-slate-100 text-slate-400"
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
                        <p className="text-xs font-bold text-slate-900">{item.title}</p>
                        {isDone && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            Verified ✓
                          </span>
                        )}
                        {isInProgress && (
                          <span className="text-[10px] font-bold text-amber-600">
                            In Review ⏳
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                        {item.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Action Button: Check Status */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => void checkStatus(false)}
              disabled={checking}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-black text-white shadow-md transition-all active:scale-[0.98] hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
              <span>{checking ? "Checking Live Status..." : "Refresh Approval Status"}</span>
            </button>
          </div>
        </div>

        {/* Bottom Help & Support Section */}
        <div className="mt-8 border-t border-slate-200/80 pt-5 text-center">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            <HelpCircle className="size-4 text-emerald-600" />
            <span>Need Help with Application? Contact Support</span>
          </button>
          <p className="mt-2 text-[10px] font-medium text-slate-400">
            QuickPress Captain Support · Available 24/7
          </p>
        </div>
      </div>

      {/* Help & Support Bottom Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-up">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Headphones className="size-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Captain Help Desk</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Application ID: <span className="font-mono font-bold text-slate-900">{applicationId}</span>
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Have questions about your verification or need expedited approval? Our Captain Onboarding team is ready to help.
            </p>

            <div className="mt-5 space-y-3">
              {/* WhatsApp Support */}
              <button
                type="button"
                onClick={openWhatsAppSupport}
                className="flex w-full items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 transition-all active:scale-[0.98]"
              >
                <span className="flex items-center gap-2.5">
                  <MessageCircle className="size-4" />
                  Chat on WhatsApp Support
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700/80 px-2 py-0.5 rounded-full">
                  Fastest
                </span>
              </button>

              {/* Call Support Helpline */}
              <a
                href="tel:+918005550199"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-black text-slate-800 shadow-xs hover:bg-slate-100 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <Phone className="size-4 text-slate-700" />
                  Call Operations Helpline
                </span>
                <span className="text-[11px] font-bold text-slate-600 font-mono">
                  1800-555-0199
                </span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="mt-4 w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
