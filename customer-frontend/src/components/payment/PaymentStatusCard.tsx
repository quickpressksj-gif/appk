/**
 * Inline payment processing / result UI — Phase 5 · Sprint 5.6.
 *
 * Renders the four states a Razorpay + wallet checkout can end in:
 * verifying (mutation in-flight), paid, failed (with reason) and cancelled.
 */
import { AlertTriangle, Check, Loader2, RotateCcw, XCircle } from "lucide-react";

export type PaymentUiStatus = "verifying" | "paid" | "failed" | "cancelled";

export function PaymentStatusCard({
  status,
  message,
  code,
  onRetry,
}: {
  status: PaymentUiStatus;
  message?: string;
  code?: string;
  onRetry?: () => void;
}) {
  if (status === "verifying") {
    return (
      <div className="card-soft mt-4 flex items-center gap-3 border border-primary/40 bg-primary/5 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
          <Loader2 className="size-4 animate-spin" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Verifying your payment…</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Please don't close this screen.
          </p>
        </div>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="card-soft mt-4 flex items-center gap-3 border border-secondary/40 bg-secondary/10 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-green text-background">
          <Check className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Payment successful</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{message ?? "Placing your order…"}</p>
        </div>
      </div>
    );
  }

  const isCancelled = status === "cancelled";
  return (
    <div className="card-soft mt-4 border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          {isCancelled ? <XCircle className="size-4" /> : <AlertTriangle className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            {isCancelled ? "Payment cancelled" : "Payment failed"}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {message ?? (isCancelled ? "You closed the payment sheet." : "Something went wrong.")}
            {code ? ` (${code})` : ""}
          </p>
        </div>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ripple mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-bold text-primary-foreground transition-all duration-300 active:scale-[0.97]"
        >
          <RotateCcw className="size-3.5" /> Retry payment
        </button>
      ) : null}
    </div>
  );
}
