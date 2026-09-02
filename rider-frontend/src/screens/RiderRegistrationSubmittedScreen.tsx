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
  Lock,
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
    body: "Profile, vehicle specs, and bank account registered.",
    status: "completed",
  },
  {
    icon: FileSearch,
    title: "Document & KYC Check",
    body: "UIDAI Aadhaar, NSDL PAN, MoRTH DL & Vahan RC verified.",
    status: "completed",
  },
  {
    icon: ShieldCheck,
    title: "Operations Admin Approval",
    body: "Final compliance verification & fleet activation.",
    status: "in_progress",
  },
  {
    icon: Clock3,
    title: "Captain Dashboard & Orders",
    body: "Auto-unlocks the moment your profile is approved.",
    status: "pending",
  },
];

export function RiderRegistrationSubmittedScreen() {
  const navigate = useNavigate();
  const { session, signIn, phone } = useRiderContext();
  const [checking, setChecking] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const targetPhone =
    phone ||
    session?.phone ||
    (typeof window !== "undefined"
      ? window.sessionStorage.getItem("qp.rider.pendingPhone") ||
        window.localStorage.getItem("qp.rider.pendingPhone") ||
        ""
      : "");

  // Generate deterministic Application ID based on rider identity / mobile / account
  const applicationId = useMemo(() => {
    const rawSeed =
      session?.riderId ||
      session?.phone ||
      targetPhone ||
      "CAPTAIN_DEFAULT";
    const hash =
      Math.abs(
        rawSeed
          .split("")
          .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0) % 90000
      ) + 10000;
    return `QP-CAP-${hash}`;
  }, [session, targetPhone]);

  const checkStatus = async (silent: boolean = false) => {
    if (checking) return;
    setChecking(true);
    try {
      const isApproved = await checkRiderVerificationStatus(
        session?.riderId || "",
        targetPhone
      );
      if (isApproved) {
        if (session) {
          signIn({
            ...session,
            isVerified: true,
            isOnboarded: true,
          });
        }
        toast.success("🎉 Congratulations! Your Captain account has been APPROVED!");
        navigate({ to: riderRoutes.dashboard });
      } else {
        if (!silent) {
          toast.info(
            "Your application is currently being verified by Operations Admin. Please check back shortly!"
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
  }, [targetPhone]);

  const copyApplicationId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(applicationId);
      toast.success("Application ID copied to clipboard!");
    }
  };

  const openWhatsAppSupport = () => {
    const text = encodeURIComponent(
      `Hello QuickPress Support, I have submitted my Captain onboarding application. My Application ID is: ${applicationId}. Mobile: ${targetPhone}. Please assist with fast approval.`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white selection:bg-emerald-500 selection:text-black">
      <Toaster position="top-center" richColors />

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-80 rounded-full bg-emerald-500/10 blur-[130px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 pb-10 pt-10 lg:max-w-2xl">
        {/* Top Header */}
        <div>
          <div className="text-center">
            <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-400 shadow-xl border border-amber-500/30 ring-8 ring-amber-500/10">
              <BadgeCheck className="size-11 stroke-[2.2]" />
            </span>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-black text-amber-300">
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
              <span>Pending Operations Review</span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Application Under Review
            </h1>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-400 max-w-sm mx-auto">
              Thank you for applying as a QuickPress Captain! Your profile, vehicle specs, and verified documents are being activated.
            </p>
          </div>

          {/* Generated Application ID Card */}
          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Application Reference ID
                </p>
                <p className="mt-0.5 font-mono text-xl font-black tracking-wider text-white">
                  {applicationId}
                </p>
              </div>
              <button
                type="button"
                onClick={copyApplicationId}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-white/10 active:scale-95 transition-all"
              >
                <Copy className="size-3.5" />
                <span>Copy ID</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-medium text-slate-400">
              <span>Estimated Approval Time</span>
              <span className="font-bold text-amber-400">Within 2 to 4 Hours</span>
            </div>
          </div>

          {/* Verification Pipeline Stepper */}
          <section className="mt-5 rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Verification Pipeline
              </p>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-Refreshing Live
              </span>
            </div>

            <ol className="mt-5 space-y-4">
              {TIMELINE.map((item) => {
                const isDone = item.status === "completed";
                const isInProgress = item.status === "in_progress";
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-4 items-start">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-all shadow-sm ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10"
                          : isInProgress
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 ring-2 ring-amber-500/20"
                            : "bg-white/5 text-slate-500 border border-white/5"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-5 stroke-[2.5]" />
                      ) : isInProgress ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-white">{item.title}</p>
                        {isDone && (
                          <span className="text-[10px] font-bold text-emerald-400">
                            Verified ✓
                          </span>
                        )}
                        {isInProgress && (
                          <span className="text-[10px] font-bold text-amber-400">
                            In Review ⏳
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400 leading-snug">
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
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 py-3.5 text-xs font-black text-white shadow-lg transition-all active:scale-[0.98] hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
              <span>{checking ? "Checking Live Status..." : "Check Status Now"}</span>
            </button>
          </div>
        </div>

        {/* Bottom Help & Support Section */}
        <div className="mt-8 border-t border-white/10 pt-5 text-center">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            <HelpCircle className="size-4 text-emerald-400" />
            <span>Need Help with Application? Contact Support</span>
          </button>
          <p className="mt-2 text-[10px] font-semibold text-slate-500">
            QuickPress Captain Support · Kasganj Operations Hub
          </p>
        </div>
      </div>

      {/* Help & Support Bottom Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-white/20"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Headphones className="size-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-white">Captain Help Desk</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Application ID: <span className="font-mono font-bold text-white">{applicationId}</span>
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              Have questions about your onboarding or need expedited approval? Our Captain Support team is available 24/7.
            </p>

            <div className="mt-5 space-y-3">
              {/* WhatsApp Support */}
              <button
                type="button"
                onClick={openWhatsAppSupport}
                className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 text-xs font-black text-slate-950 shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
              >
                <span className="flex items-center gap-2.5">
                  <MessageCircle className="size-4" />
                  Chat on WhatsApp Support
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                  Fastest
                </span>
              </button>

              {/* Call Support Helpline */}
              <a
                href="tel:18005550199"
                className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-xs font-black text-white shadow-sm hover:bg-white/10 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <Phone className="size-4 text-emerald-400" />
                  Call Operations Helpline
                </span>
                <span className="text-[11px] font-bold text-slate-300 font-mono">
                  1800-555-0199
                </span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="mt-4 w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
