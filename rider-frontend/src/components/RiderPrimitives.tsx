import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Compact metric tile used on Dashboard / Wallet. */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "green" | "muted";
  delay?: number;
}) {
  const toneClass =
    tone === "green"
      ? "bg-secondary/10 text-brand-green"
      : tone === "muted"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/15 text-brand-dark";

  return (
    <div className="card-soft border border-border p-4 transition-all duration-300 hover:border-primary/60"
    >
      <span className={`flex size-9 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <p className="mt-3 text-lg font-black tracking-tight text-foreground">{value}</p>
      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {hint ? <p className="mt-1 text-[0.68rem] font-medium text-brand-green">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-black tracking-tight text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function RiderEmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="card-soft mt-4 flex flex-col items-center border border-border px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-bold tracking-tight text-foreground">{title}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{body}</p>
    </div>
  );
}

export function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  delay?: number;
}) {
  return (
    <div className="card-soft flex items-center gap-3 border border-border p-4"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
        <Icon className="size-5" strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold tracking-tight text-foreground">{label}</p>
        <p className="truncate text-[0.7rem] font-medium text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? "bg-secondary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-background shadow-soft transition-all duration-300 ${
            checked ? "left-[1.4rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/** Primary CTA — identical treatment to the customer & partner apps. */
export function RiderPrimaryButton({
  children,
  onClick,
  disabled,
  tone = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "primary" | "outline" | "danger";
  type?: "button" | "submit";
}) {
  const toneClass =
    tone === "outline"
      ? "border border-border bg-card text-foreground"
      : tone === "danger"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary text-primary-foreground shadow-cta";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`ripple flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black tracking-tight transition-all duration-300 active:scale-[0.97] disabled:opacity-70 ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

/** Bottom sheet with the shared sheet-up animation. */
export function RiderBottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 bg-foreground/40"
      />
      <div className="animate-sheet-up relative w-full max-w-md rounded-t-4xl bg-card p-5 pb-8 shadow-soft">
        <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-border" />
        <h3 className="text-base font-black tracking-tight text-foreground">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
