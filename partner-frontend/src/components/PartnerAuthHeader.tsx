import { Store } from "lucide-react";

/**
 * Centered QuickPress Partner brand header used at the top of auth screens.
 */
export function PartnerAuthHeader() {
  return (
    <div className="flex flex-col items-center animate-slide-up">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
          <Store className="size-6" strokeWidth={2.3} />
        </span>
        <div>
          <p className="text-xl font-black tracking-tight text-foreground">
            Quick<span className="text-brand-green">Press</span> Partner
          </p>
          <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Business Onboarding
          </p>
        </div>
      </div>
    </div>
  );
}
