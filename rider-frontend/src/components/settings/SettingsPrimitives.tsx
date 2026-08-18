import { Check, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/shared/ui/skeleton";

/** Card wrapper with the shared rise-in entrance. */
export function SettingsCard({
  title,
  caption,
  children,
  delay = 0,
}: {
  title?: string;
  caption?: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="card-soft animate-rise border border-border p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      {title ? (
        <h2 className="text-sm font-black tracking-tight text-foreground">{title}</h2>
      ) : null}
      {caption ? (
        <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">{caption}</p>
      ) : null}
      <div className={title || caption ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

/** Tappable row that navigates deeper into the settings tree. */
export function SettingsNavRow({
  icon: Icon,
  label,
  hint,
  value,
  onClick,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  value?: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  const iconTone =
    tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-brand-dark";

  return (
    <button
      type="button"
      onClick={onClick}
      className="ripple flex w-full items-center gap-3 py-3 text-left transition-all duration-300 active:scale-[0.99]"
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${iconTone}`}>
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[0.82rem] font-bold tracking-tight ${
            tone === "danger" ? "text-destructive" : "text-foreground"
          }`}
        >
          {label}
        </span>
        {hint ? (
          <span className="block truncate text-[0.68rem] font-medium text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
      {value ? (
        <span className="shrink-0 text-[0.7rem] font-bold text-muted-foreground">{value}</span>
      ) : null}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function SettingsToggle({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 py-3 ${disabled ? "opacity-50" : ""}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15">
        <Icon className="size-4 text-brand-dark" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8rem] font-bold tracking-tight text-foreground">{label}</span>
        <span className="block text-[0.68rem] font-medium leading-relaxed text-muted-foreground">
          {hint}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        disabled={disabled}
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? "bg-secondary/70" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-card shadow-soft transition-all duration-300 ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: string;
  error?: string | undefined;
}) {
  return (
    <label className="block py-2">
      <span className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className={`field-focus mt-1.5 min-h-12 w-full rounded-2xl border bg-card px-4 text-sm font-semibold text-foreground outline-none ${
          error ? "border-destructive" : "border-border"
        }`}
      />
      {error ? (
        <span className="mt-1 block text-[0.66rem] font-bold text-destructive">{error}</span>
      ) : null}
    </label>
  );
}

/** Segmented pill selector used for theme, shift and language choices. */
export function SettingsChoice<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: ReadonlyArray<{ id: T; label: string; hint?: string; icon?: LucideIcon }>;
  value: T;
  onChange: (next: T) => void;
  columns?: 1 | 2 | 3;
}) {
  const grid = columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className={`grid gap-2 ${grid}`}>
      {options.map((option) => {
        const active = option.id === value;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`rounded-2xl border px-3 py-3 text-left transition-all duration-300 active:scale-[0.97] ${
              active
                ? "border-primary bg-primary/15 text-brand-dark"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span className="flex items-center gap-2">
              {Icon ? <Icon className="size-4 shrink-0" strokeWidth={2.2} /> : null}
              <span className="truncate text-xs font-black tracking-tight">{option.label}</span>
              {active ? <Check className="ml-auto size-3.5 shrink-0" strokeWidth={3} /> : null}
            </span>
            {option.hint ? (
              <span className="mt-1 block text-[0.64rem] font-semibold text-muted-foreground">
                {option.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "bg-secondary/15 text-brand-green"
      : tone === "warning"
        ? "bg-primary/15 text-brand-dark"
        : tone === "danger"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${toneClass}`}
    >
      {label}
    </span>
  );
}

/** Skeleton shown while a settings screen "loads". */
export function SettingsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 px-5 pb-32 pt-4">
      <Skeleton className="h-28 w-full rounded-3xl" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-36 w-full rounded-3xl" />
      ))}
    </div>
  );
}

/** Full-screen success confirmation with the shared pop animation. */
export function SettingsSuccess({ open, message }: { open: boolean; message: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center px-8">
      <div className="animate-overlay-in absolute inset-0 bg-foreground/40" />
      <div className="animate-success-pop relative w-full max-w-xs rounded-4xl bg-card p-7 text-center shadow-soft">
        <span className="animate-settings-check mx-auto grid size-14 place-items-center rounded-full bg-secondary/15 text-brand-green">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <p className="mt-4 text-sm font-black tracking-tight text-foreground">{message}</p>
      </div>
    </div>
  );
}

/** Premium confirmation dialog (logout, revoke session, etc). */
export function SettingsConfirmDialog({
  open,
  icon: Icon,
  title,
  body,
  confirmLabel,
  cancelLabel = "Stay signed in",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  icon: LucideIcon;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-destructive text-primary-foreground"
      : "bg-primary text-primary-foreground shadow-cta";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="animate-overlay-in absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-up relative w-full max-w-md rounded-t-4xl bg-card p-6 pb-8 shadow-soft sm:rounded-4xl"
      >
        <span className="mx-auto mb-5 block h-1 w-10 rounded-full bg-border sm:hidden" />
        <span
          className={`animate-pop mx-auto grid size-14 place-items-center rounded-3xl ${
            tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-brand-dark"
          }`}
        >
          <Icon className="size-6" strokeWidth={2.2} />
        </span>
        <h3 className="mt-4 text-center text-base font-black tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 text-center text-[0.76rem] font-medium leading-relaxed text-muted-foreground">
          {body}
        </p>
        <div className="mt-6 space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`ripple flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black tracking-tight transition-all duration-300 active:scale-[0.97] disabled:opacity-70 ${confirmClass}`}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex w-full items-center justify-center rounded-2xl border border-border bg-card py-4 text-sm font-black tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}