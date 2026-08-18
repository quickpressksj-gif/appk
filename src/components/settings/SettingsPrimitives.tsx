import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* ---------------- Section shell ---------------- */

export function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
          <Icon className="size-4" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2
            id={`${id}-heading`}
            className="truncate text-sm font-black tracking-tight text-foreground"
          >
            {title}
          </h2>
          <p className="truncate text-[0.68rem] font-medium text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/* ---------------- Rows ---------------- */

export function SettingsNavRow({
  icon: Icon,
  label,
  value,
  onClick,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ripple flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-300 hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
          tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-brand-dark"
        }`}
      >
        <Icon className="size-4" strokeWidth={2.1} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-bold tracking-tight ${
            tone === "danger" ? "text-destructive" : "text-foreground"
          }`}
        >
          {label}
        </span>
        {value ? (
          <span className="block truncate text-[0.7rem] font-medium text-muted-foreground">
            {value}
          </span>
        ) : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

export function SettingsInfoRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-4" strokeWidth={2.1} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-bold tracking-tight text-foreground">{value}</p>
      </div>
      {badge}
    </div>
  );
}

/** Accessible switch row matching the Partner ToggleRow visual language. */
export function SettingsToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
        <Icon className="size-4" strokeWidth={2.1} aria-hidden="true" />
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
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50 ${
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

/* ---------------- Inputs ---------------- */

export function SettingsTimeField({
  id,
  label,
  value,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  hint: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div className="field-focus mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
        <input
          id={id}
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none"
        />
      </div>
      <p className="mt-1.5 text-[0.66rem] font-medium text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SettingsStepper({
  id,
  label,
  value,
  suffix,
  min,
  max,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p id={id} className="truncate text-sm font-bold tracking-tight text-foreground">
          {label}
        </p>
        <p className="truncate text-[0.7rem] font-medium text-muted-foreground">
          {min}–{max} {suffix}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="flex size-9 items-center justify-center rounded-2xl bg-muted text-lg font-black leading-none text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94] disabled:opacity-40"
        >
          −
        </button>
        <output
          htmlFor={id}
          aria-live="polite"
          className="min-w-[4.5rem] text-center text-sm font-black tracking-tight text-foreground"
        >
          {value} {suffix}
        </output>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="flex size-9 items-center justify-center rounded-2xl bg-muted text-lg font-black leading-none text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94] disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SettingsChoiceChip({
  label,
  description,
  selected,
  onClick,
  icon: Icon,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex flex-1 flex-col items-start gap-1 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300 active:scale-[0.97] ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <span className="flex items-center gap-1.5">
        {Icon ? <Icon className="size-4 text-brand-dark" aria-hidden="true" /> : null}
        <span className="text-sm font-bold tracking-tight text-foreground">{label}</span>
      </span>
      {description ? (
        <span className="text-[0.66rem] font-medium leading-snug text-muted-foreground">
          {description}
        </span>
      ) : null}
    </button>
  );
}

export function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <div className="card-soft divide-y divide-border border border-border">{children}</div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="ripple w-full rounded-2xl bg-primary py-3.5 text-sm font-bold tracking-tight text-primary-foreground shadow-soft transition-all duration-300 active:scale-[0.97]"
    >
      {children}
    </button>
  );
}
