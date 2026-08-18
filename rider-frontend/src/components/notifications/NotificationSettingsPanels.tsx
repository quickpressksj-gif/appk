import type { LucideIcon } from "lucide-react";

/**
 * UI-only preference primitives for the Rider notification settings screen
 * (Sprint 4.7). No backend writes — state lives in the screen component.
 */
export function SettingsSection({
  title,
  caption,
  children,
  delay = 0,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="card-soft animate-rise border border-border p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="text-sm font-black tracking-tight text-foreground">{title}</h2>
      {caption ? (
        <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">{caption}</p>
      ) : null}
      <div className="mt-3 divide-y divide-border">{children}</div>
    </section>
  );
}

export function SettingsToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
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

export function SettingsTimeRow({
  label,
  from,
  to,
  onFrom,
  onTo,
  disabled,
}: {
  label: string;
  from: string;
  to: string;
  onFrom: (next: string) => void;
  onTo: (next: string) => void;
  disabled: boolean;
}) {
  return (
    <div className={`py-3 ${disabled ? "opacity-50" : ""}`}>
      <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="time"
          value={from}
          disabled={disabled}
          onChange={(event) => onFrom(event.target.value)}
          aria-label="Do not disturb from"
          className="min-h-11 flex-1 rounded-2xl border border-border bg-card px-3 text-sm font-bold text-foreground outline-none"
        />
        <span className="text-[0.68rem] font-bold text-muted-foreground">to</span>
        <input
          type="time"
          value={to}
          disabled={disabled}
          onChange={(event) => onTo(event.target.value)}
          aria-label="Do not disturb until"
          className="min-h-11 flex-1 rounded-2xl border border-border bg-card px-3 text-sm font-bold text-foreground outline-none"
        />
      </div>
    </div>
  );
}
