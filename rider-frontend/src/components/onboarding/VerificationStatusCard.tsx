import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import React from "react";

interface VerificationStatusCardProps {
  title: string;
  isVerified: boolean;
  isLoading?: boolean;
  error?: string | null;
  verifiedText?: string;
  helperText?: string;
  children?: React.ReactNode;
}

export function VerificationStatusCard({
  title,
  isVerified,
  isLoading = false,
  error = null,
  verifiedText = "Government Database Verified ✓",
  helperText = "Instant verification with official registry",
  children,
}: VerificationStatusCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
        isVerified
          ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
          : error
            ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10"
            : "border-border/80 bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-8 items-center justify-center rounded-xl transition-colors ${
              isVerified
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : error
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-amber-500" />
            ) : isVerified ? (
              <CheckCircle2 className="size-4.5" />
            ) : error ? (
              <AlertCircle className="size-4.5" />
            ) : (
              <ShieldCheck className="size-4.5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            <p className="text-[0.68rem] text-muted-foreground">{helperText}</p>
          </div>
        </div>

        <div>
          {isLoading ? (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[0.68rem] font-bold text-amber-600 dark:text-amber-400">
              <Loader2 className="size-3 animate-spin" />
              Verifying...
            </span>
          ) : isVerified ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[0.68rem] font-black text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Verified
            </span>
          ) : error ? (
            <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-1 text-[0.68rem] font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle className="size-3.5" />
              Check Error
            </span>
          ) : null}
        </div>
      </div>

      {children && <div className="mt-3.5">{children}</div>}

      {isVerified && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>{verifiedText}</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
