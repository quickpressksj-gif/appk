import type { LucideIcon } from "lucide-react";
import { Check, CloudUpload, FileCheck2, X } from "lucide-react";
import type { ReactNode } from "react";

/** Horizontal progress indicator for the multi-step onboarding flow. */
export function OnboardingStepper({
  steps,
  current,
}: {
  steps: readonly { id: number; title: string }[];
  current: number;
}) {
  const percent = Math.round(((current - 1) / (steps.length - 1)) * 100);

  return (
    <div className="px-5 pt-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-widest text-muted-foreground">
            Step {current} of {steps.length}
          </p>
          <p className="mt-0.5 text-base font-black tracking-tight text-foreground">
            {steps[current - 1]?.title}
          </p>
        </div>
        <p className="text-[0.7rem] font-bold text-brand-green">{percent}% complete</p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Registration progress"
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand-green transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(percent, 6)}%` }}
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {steps.map((step) => {
          const done = step.id < current;
          const active = step.id === current;
          return (
            <span
              key={step.id}
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-black transition-all duration-300 ${
                done
                  ? "bg-secondary/20 text-brand-green"
                  : active
                    ? "bg-primary text-primary-foreground shadow-cta"
                    : "bg-muted text-muted-foreground"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : step.id}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function StepShell({
  title,
  caption,
  children,
  stepKey,
}: {
  title: string;
  caption: string;
  children: ReactNode;
  stepKey: string | number;
}) {
  return (
    <section key={stepKey} className="animate-slide-up">
      <h2 className="text-xl font-black leading-tight tracking-tight text-foreground">{title}</h2>
      <p className="mt-1 text-[0.75rem] font-medium text-muted-foreground">{caption}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function TextField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  error,
  optional,
  type = "text",
  inputMode,
  maxLength,
  uppercase,
  multiline,
}: {
  id: string;
  label: string;
  icon?: LucideIcon | undefined;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string | undefined;
  error?: string | undefined;
  optional?: boolean | undefined;
  type?: "text" | "email" | "date" | "tel" | undefined;
  inputMode?: "text" | "numeric" | "email" | "tel" | undefined;
  maxLength?: number | undefined;
  uppercase?: boolean | undefined;
  multiline?: boolean | undefined;
}) {
  const shared =
    "min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground";

  return (
    <div>
      <label
        htmlFor={id}
        className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
        {optional ? " (optional)" : ""}
      </label>
      <div
        className={`field-focus mt-1.5 flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-soft transition-colors duration-300 focus-within:border-primary ${
          error ? "border-destructive" : "border-border"
        }`}
      >
        {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
        {multiline ? (
          <textarea
            id={id}
            rows={3}
            value={value}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            onChange={(e) => onChange(e.target.value)}
            className={`${shared} resize-none`}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            placeholder={placeholder}
            inputMode={inputMode}
            maxLength={maxLength}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
            className={shared}
          />
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[0.68rem] font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ChoiceChips({
  label,
  options,
  value,
  onChange,
  columns = 3,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  columns?: number;
}) {
  return (
    <div>
      <p className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-2 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`ripple rounded-2xl border px-3 py-3 text-xs font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
              value === option
                ? "border-primary bg-primary/15 text-brand-dark"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VehiclePicker({
  options,
  value,
  onChange,
}: {
  options: readonly { id: string; label: string; hint: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Vehicle type" className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className={`ripple rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.97] ${
            value === option.id
              ? "border-primary bg-primary/10 shadow-soft"
              : "border-border bg-card"
          }`}
        >
          <p className="text-sm font-black tracking-tight text-foreground">{option.label}</p>
          <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">{option.hint}</p>
        </button>
      ))}
    </div>
  );
}

/** Local-only and Remote upload tile with file picker, base64 preview, and direct click support. */
export function UploadTile({
  id,
  label,
  hint,
  value,
  fileName,
  previewUrl,
  onUpload,
  onSelect,
  onClear,
  error,
}: {
  id?: string;
  label: string;
  hint: string;
  value?: string | undefined;
  fileName?: string | undefined;
  previewUrl?: string | undefined;
  onUpload?: (file: File) => void;
  onSelect?: (name: string, dataUrl?: string) => void;
  onClear?: () => void;
  error?: string | null | undefined;
}) {
  const inputId = id || `upload-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const displayImage = previewUrl || (value && value.startsWith("data:image/") ? value : value && value.startsWith("http") ? value : undefined);
  const displayName = fileName || (value && !value.startsWith("data:") ? value.split("/").pop() : undefined);
  const uploaded = Boolean(value || fileName || previewUrl);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onUpload) {
      onUpload(file);
    }
    if (onSelect) {
      const name = file.name;
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          onSelect(name, reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        onSelect(name);
      }
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-1">
      <div
        onClick={triggerUpload}
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-3.5 transition-all duration-300 hover:border-amber-400 ${
          uploaded
            ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10"
            : error
              ? "border-rose-500/50 bg-rose-500/5"
              : "border-border bg-card"
        }`}
      >
        <span
          className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
            uploaded ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          {displayImage ? (
            <img src={displayImage} alt={label} className="size-full object-cover rounded-2xl" />
          ) : uploaded ? (
            <FileCheck2 className="size-5" />
          ) : (
            <CloudUpload className="size-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold tracking-tight text-foreground">{label}</p>
          <p className="truncate text-[0.66rem] font-medium text-muted-foreground">
            {uploaded ? (displayName || "Document Uploaded ✓") : hint}
          </p>
        </div>

        {uploaded ? (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all hover:bg-rose-500/20 hover:text-rose-500 active:scale-95"
          >
            <X className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={triggerUpload}
            className="rounded-xl bg-amber-400 px-3 py-1.5 text-[0.68rem] font-black text-black shadow-sm transition-transform active:scale-95 hover:bg-amber-300"
          >
            Upload
          </button>
        )}

        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="text-[0.68rem] font-semibold text-rose-500">{error}</p>}
    </div>
  );
}

export function ReviewGroup({
  title,
  onEdit,
  rows,
}: {
  title: string;
  onEdit: () => void;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="card-soft border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full bg-muted px-3 py-1 text-[0.66rem] font-bold text-brand-dark transition-all duration-300 active:scale-[0.95]"
        >
          Edit
        </button>
      </div>
      <dl className="mt-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0">
            <dt className="text-[0.7rem] font-semibold text-muted-foreground">{row.label}</dt>
            <dd className="max-w-[60%] text-right text-[0.75rem] font-bold tracking-tight text-foreground">
              {row.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
