import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Sprint 3.10 — bottom sheet (mobile) / centered dialog (tablet+) for Settings. */
export function SettingsSheet({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string | undefined;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-up relative flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl border border-border bg-card shadow-soft md:max-w-lg md:rounded-3xl"
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black tracking-tight text-foreground">{title}</h2>
            {subtitle ? (
              <p className="truncate text-[0.7rem] font-medium text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close sheet"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  tone = "default",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <SettingsSheet open={open} title={title} onClose={onCancel}>
      <p className="text-sm font-medium leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-border bg-card py-3 text-sm font-bold tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`ripple flex-1 rounded-2xl py-3 text-sm font-bold tracking-tight shadow-soft transition-all duration-300 active:scale-[0.97] ${
            tone === "danger"
              ? "bg-destructive text-primary-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </SettingsSheet>
  );
}
