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
      ? "bg-emerald-50 text-emerald-600"
      : tone === "muted"
        ? "bg-slate-100 text-slate-600"
        : "bg-slate-900 text-white";

  return (
    <div
      className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`flex size-8 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <p className="mt-2.5 text-lg font-black tracking-tight text-slate-900">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {hint ? <p className="mt-1 text-[10px] font-semibold text-emerald-600">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">{title}</h2>
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
    <div className="mt-3 flex flex-col items-center rounded-3xl border border-slate-200/80 bg-white px-6 py-8 text-center shadow-sm">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-500 max-w-xs">{body}</p>
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
    <div
      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
        <Icon className="size-4.5" strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-slate-900">{label}</p>
        <p className="truncate text-[11px] font-medium text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? "bg-emerald-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-all duration-300 ${
            checked ? "left-[1.35rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/** Primary CTA */
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
      ? "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
      : tone === "danger"
        ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
        : "bg-slate-900 text-white shadow-sm hover:bg-slate-800";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black tracking-tight transition-all duration-300 active:scale-[0.97] disabled:opacity-60 ${toneClass}`}
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
    <div className="flex items-start gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-xs font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

/** Bottom sheet with modern white card styling. */
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
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
      />
      <div className="relative w-full max-w-md rounded-t-3xl border-t border-slate-100 bg-white p-5 pb-8 shadow-2xl">
        <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-slate-200" />
        <h3 className="text-base font-black tracking-tight text-slate-900">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
