import { Check, CheckCircle2, ChevronDown, Plus, X, type LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

/* ---------------- Step progress ---------------- */

export function StepProgress({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  const pct = ((current + 1) / steps.length) * 100;

  return (
    <div className="glass-panel sticky top-0 z-20 px-5 pb-3 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">
          Step {current + 1} of {steps.length}
        </p>
        <p className="text-[0.7rem] font-black tracking-tight text-brand-green">
          {Math.round(pct)}%
        </p>
      </div>
      <p className="mt-0.5 text-sm font-black tracking-tight text-foreground">{steps[current]}</p>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        {steps.map((label, index) => (
          <span
            key={label}
            aria-hidden
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              index < current
                ? "bg-brand-green"
                : index === current
                  ? "bg-primary"
                  : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Inputs ---------------- */

export function FormField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  prefix,
  ...rest
}: {
  id: string;
  label: string;
  icon?: LucideIcon;
  error?: string | undefined;
  hint?: string;
  prefix?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={`field-focus mt-2 flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-soft ${
          error ? "border-destructive" : "border-border"
        }`}
      >
        {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
        {prefix ? (
          <>
            <span className="text-sm font-bold text-foreground">{prefix}</span>
            <span className="h-5 w-px bg-border" />
          </>
        ) : null}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          {...rest}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error ? (
        <p className="animate-soft-fade mt-1.5 text-[0.68rem] font-semibold text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.68rem] font-medium text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  error?: string | undefined;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={`field-focus mt-2 rounded-2xl border bg-card px-4 py-3 shadow-soft ${
          error ? "border-destructive" : "border-border"
        }`}
      >
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-none bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error ? (
        <p className="animate-soft-fade mt-1.5 text-[0.68rem] font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder = "Select",
  error,
}: {
  id: string;
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  placeholder?: string;
  error?: string | undefined;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={`field-focus relative mt-2 flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-soft ${
          error ? "border-destructive" : "border-border"
        }`}
      >
        {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </div>
      {error ? (
        <p className="animate-soft-fade mt-1.5 text-[0.68rem] font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SliderField({
  id,
  label,
  value,
  onChange,
  min = 1,
  max = 25,
  unit = "km",
}: {
  id: string;
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground"
        >
          {label}
        </label>
        <span className="text-[0.72rem] font-black tracking-tight text-brand-green">
          {value} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
      />
    </div>
  );
}

/* ---------------- Choice controls ---------------- */

export function ChoiceChip({
  label,
  selected,
  onClick,
  icon: Icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`ripple focus-key flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-[0.72rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
        selected
          ? "border-primary bg-primary/12 text-brand-dark shadow-soft"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {Icon ? <Icon className="size-3.5" strokeWidth={2.4} /> : null}
      {label}
      {selected ? <Check className="size-3.5 text-brand-green" strokeWidth={3} /> : null}
    </button>
  );
}

export function ServiceCard({
  label,
  description,
  selected,
  onClick,
  icon: Icon,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`ripple focus-key flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-soft transition-all duration-300 active:scale-[0.98] ${
        selected ? "border-primary bg-primary/10" : "border-border bg-card"
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
          selected ? "bg-primary/20 text-brand-dark" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold tracking-tight text-foreground">
          {label}
        </span>
        <span className="block truncate text-[0.68rem] font-medium text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
          selected
            ? "animate-success-pop border-brand-green bg-brand-green text-background"
            : "border-border bg-background"
        }`}
      >
        {selected ? <Check className="size-3.5" strokeWidth={3.2} /> : null}
      </span>
    </button>
  );
}

/* ---------------- Uploads (placeholder UI only) ---------------- */

export function UploadTile({
  label,
  hint,
  value,
  onPick,
  onClear,
  icon: Icon,
  aspect = "square",
}: {
  label: string;
  hint?: string;
  value: string;
  onPick: (name: string) => void;
  onClear: () => void;
  icon: LucideIcon;
  aspect?: "square" | "wide";
}) {
  return (
    <div>
      <label
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed bg-card p-4 text-center shadow-soft transition-all duration-300 hover:border-primary active:scale-[0.98] ${
          value ? "border-brand-green" : "border-border"
        } ${aspect === "wide" ? "h-28" : "h-32"}`}
      >
        <span
          className={`flex size-10 items-center justify-center rounded-2xl transition-colors ${
            value ? "bg-secondary/15 text-brand-green" : "bg-primary/15 text-brand-dark"
          }`}
        >
          {value ? (
            <CheckCircle2 className="animate-success-pop size-5" />
          ) : (
            <Icon className="size-4" />
          )}
        </span>
        <span className="text-[0.72rem] font-bold tracking-tight text-foreground">{label}</span>
        <span className="line-clamp-1 text-[0.62rem] font-medium text-muted-foreground">
          {value || hint || "Tap to upload"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onPick(event.target.files?.[0]?.name ?? "")}
        />
      </label>
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-1.5 flex items-center gap-1 text-[0.65rem] font-bold text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-3" /> Remove
        </button>
      ) : null}
    </div>
  );
}

export function GalleryUploader({
  images,
  onAdd,
  onRemove,
  max = 5,
}: {
  images: string[];
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
  max?: number;
}) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        {images.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className="animate-pop relative flex h-20 items-center justify-center rounded-2xl border border-border bg-muted p-2 text-center"
          >
            <span className="line-clamp-2 text-[0.6rem] font-semibold text-muted-foreground">
              {name}
            </span>
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={() => onRemove(index)}
              className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-soft active:scale-90"
            >
              <X className="size-3" strokeWidth={3} />
            </button>
          </div>
        ))}

        {images.length < max ? (
          <label className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card text-center transition-all duration-300 hover:border-primary active:scale-[0.97]">
            <Plus className="size-4 text-muted-foreground" />
            <span className="text-[0.6rem] font-bold text-muted-foreground">Add photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onAdd(event.target.files?.[0]?.name ?? "")}
            />
          </label>
        ) : null}
      </div>
      <p className="mt-2 text-[0.65rem] font-medium text-muted-foreground">
        {images.length}/{max} photos added
      </p>
    </div>
  );
}

/* ---------------- Layout helpers ---------------- */

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card-soft space-y-4 border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
          {description ? (
            <p className="mt-0.5 text-[0.7rem] font-medium text-muted-foreground/80">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[0.7rem] font-semibold text-muted-foreground">{label}</span>
      <span className="max-w-[58%] text-right text-[0.72rem] font-bold tracking-tight text-foreground">
        {value || "—"}
      </span>
    </div>
  );
}
