import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check, Clock3, Headphones, ShieldCheck } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerAuthHeader } from "../components/PartnerAuthHeader";
import { usePartnerContext } from "../context/PartnerContext";
import { partnerRoutes } from "../navigation/partner-routes";

const TIMELINE = [
  { icon: Check, label: "Application received", body: "Your details are with our onboarding team", done: true },
  { icon: ShieldCheck, label: "Document verification", body: "PAN, Aadhaar and bank check in progress", done: false },
  { icon: BadgeCheck, label: "Shop goes live", body: "You start receiving QuickPress orders", done: false },
];

export function RegistrationSubmittedScreen() {
  const navigate = useNavigate();
  const { session } = usePartnerContext();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-14">
        <PartnerAuthHeader />

        <section className="mt-10 flex flex-col items-center text-center">
          <span className="animate-success-pop relative flex size-24 items-center justify-center rounded-full bg-secondary/15 text-brand-green">
            <span className="absolute inset-0 animate-ping rounded-full bg-secondary/15" />
            <Check className="size-11" strokeWidth={3} />
          </span>

          <h1 className="animate-slide-up stagger-1 mt-6 text-2xl font-black leading-tight tracking-tight text-foreground">
            Registration Submitted Successfully
          </h1>
          <p className="animate-slide-up stagger-2 mt-2 text-sm font-medium text-muted-foreground">
            {session?.businessName
              ? `${session.businessName} is queued for review.`
              : "Your shop is queued for review."}{" "}
            We usually complete verification within 24-48 hours.
          </p>

          <span className="animate-slide-up stagger-3 mt-5 inline-flex items-center gap-2 rounded-full bg-primary/12 px-4 py-2 text-[0.72rem] font-black uppercase tracking-widest text-brand-dark">
            <Clock3 className="size-3.5" strokeWidth={2.8} />
            Pending Admin Verification
          </span>

          {session?.partnerId ? (
            <p className="animate-slide-up stagger-4 mt-3 text-[0.7rem] font-semibold text-muted-foreground">
              Application ID · {session.partnerId}
            </p>
          ) : null}
        </section>

        <section className="animate-slide-up stagger-4 card-soft mt-8 space-y-4 border border-border p-4">
          {TIMELINE.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${
                  item.done ? "bg-secondary/15 text-brand-green" : "bg-muted text-muted-foreground"
                }`}
              >
                <item.icon className="size-4" strokeWidth={2.3} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-foreground">{item.label}</p>
                <p className="text-[0.7rem] font-medium text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={() => navigate({ to: partnerRoutes.dashboard })}
            className="ripple focus-key flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
          >
            Go to Partner Dashboard
            <ArrowRight className="size-4" strokeWidth={2.6} />
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: partnerRoutes.notifications })}
            className="ripple focus-key mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-black tracking-tight text-foreground shadow-soft active:scale-[0.97]"
          >
            <Headphones className="size-4" strokeWidth={2.4} />
            Contact partner support
          </button>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
