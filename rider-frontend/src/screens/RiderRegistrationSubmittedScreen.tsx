import { useEffect, useState } from "react";
import { toast } from "sonner";

import { riderRoutes } from "../navigation/rider-routes";
import { checkRiderVerificationStatus } from "@/api/rider/rider-auth-api";
import { useRiderContext } from "../context/RiderContext";

const TIMELINE = [
  { icon: BadgeCheck, title: "Application received", body: "Your details are safely submitted.", done: true },
  { icon: FileSearch, title: "Document verification", body: "Usually completed within 24 hours.", done: false },
  { icon: ShieldCheck, title: "Background check", body: "License and vehicle validation.", done: false },
  { icon: Clock3, title: "Account activation", body: "You'll get an SMS once you can go online.", done: false },
];

export function RiderRegistrationSubmittedScreen() {
  const navigate = useNavigate();
  const { signIn } = useRiderContext();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    let active = true;
    void checkRiderVerificationStatus().then((res) => {
      if (!active) return;
      if (res.isVerified) {
        setApproved(true);
        toast.success("Congratulations! Your rider account is active.");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-16 lg:max-w-2xl">
        <div className="animate-slide-up text-center">
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-secondary/15 text-brand-green">
            <BadgeCheck className="size-10" strokeWidth={2.2} />
          </span>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-foreground">
            Application submitted
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
            Thanks for signing up as a QuickPress delivery partner. Our team is reviewing your
            documents and will notify you as soon as your account is approved.
          </p>
        </div>

        <section className="card-soft animate-rise mt-7 border border-border p-4">
          <p className="text-[0.66rem] font-black uppercase tracking-widest text-muted-foreground">
            What happens next
          </p>
          <ol className="mt-3 space-y-3">
            {TIMELINE.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${
                    item.done ? "bg-secondary/20 text-brand-green" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight text-foreground">{item.title}</p>
                  <p className="text-[0.7rem] font-medium text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => navigate({ to: riderRoutes.dashboard })}
            className="ripple w-full rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
          >
            Explore the rider app
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: riderRoutes.settings })}
            className="ripple flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-black tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
          >
            <LifeBuoy className="size-4" />
            Contact support
          </button>
        </div>
      </div>
    </main>
  );
}
