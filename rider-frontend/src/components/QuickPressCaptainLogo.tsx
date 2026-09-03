import { ArrowUpRight } from "lucide-react";

type LogoProps = {
  variant?: "stacked" | "inline" | "icon-only";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function QuickPressCaptainLogo({
  variant = "stacked",
  size = "md",
  className = "",
}: LogoProps) {
  if (variant === "icon-only") {
    const iconSizes = {
      sm: "size-8 rounded-xl",
      md: "size-11 rounded-2xl",
      lg: "size-14 rounded-3xl",
    };
    const arrowSizes = {
      sm: "size-4.5 stroke-[2.8]",
      md: "size-6 stroke-[2.6]",
      lg: "size-8 stroke-[2.6]",
    };

    return (
      <div
        className={`flex items-center justify-center bg-emerald-600 text-white shadow-xs transition-transform ${iconSizes[size]} ${className}`}
      >
        <ArrowUpRight className={arrowSizes[size]} />
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
          <ArrowUpRight className="size-4 stroke-[2.8]" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-extrabold tracking-tight text-slate-900">
            QuickPress
          </span>
          <span className="rounded bg-amber-400 px-1 py-0.2 text-[9px] font-black uppercase tracking-wider text-slate-950">
            CAPTAIN
          </span>
        </div>
      </div>
    );
  }

  // Stacked variant (Figma Screen 1 hero style)
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Brand Icon Badge */}
      <div className="flex size-13 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
        <ArrowUpRight className="size-7.5 stroke-[2.6]" />
      </div>

      {/* Brand Wordmark & Pill */}
      <div className="mt-3.5 flex items-center justify-center gap-1.5">
        <span className="text-xl font-black tracking-tight text-slate-950">
          QuickPress
        </span>
        <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-2xs">
          CAPTAIN
        </span>
      </div>
    </div>
  );
}
