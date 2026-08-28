import type { LucideIcon } from "lucide-react";
import { Check, CloudUpload, FileCheck2, X } from "lucide-react";
import React, { type ReactNode, useRef } from "react";

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
        <p className="text-[0.7rem] font-bold text-amber-500">{percent}% complete</p>
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
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-[width] duration-500 ease-out"
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
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : active
                    ? "bg-amber-400 text-black shadow-md"
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
}: {
  id: string;
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  error?: string | null;
  optional?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  uppercase?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[0.72rem] font-bold text-foreground">
          {label}
        </label>
        {optional && (
          <span className="text-[0.62rem] font-semibold text-muted-foreground">Optional</span>
        )}
      </div>

      <div className="relative mt-1.5">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
            <Icon className="size-4" />
          </span>
        )}
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-card py-3 text-xs font-semibold text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 ${
            Icon ? "pl-10 pr-3.5" : "px-3.5"
          } ${error ? "border-rose-500 ring-1 ring-rose-500/20" : "border-border"}`}
        />
      </div>

      {error && <p className="mt-1 text-[0.68rem] font-semibold text-rose-500">{error}</p>}
    </div>
  );
}

export function ChoiceChips({
  label,
  options,
  value,
  selected,
  onChange,
  className,
  columns,
}: {
  label?: string;
  options: readonly string[];
  value?: string;
  selected?: string;
  onChange: (next: string) => void;
  className?: string;
  columns?: number;
}) {
  const activeValue = selected !== undefined ? selected : value;
  const cols = columns || options.length;

  return (
    <div className={className}>
      {label && (
        <p className="text-[0.72rem] font-bold text-foreground mb-1.5">
          {label}
        </p>
      )}
      <div
        role="radiogroup"
        aria-label={label || "Options"}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const isSelected = activeValue === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold tracking-tight transition-all duration-200 active:scale-[0.97] ${
                isSelected
                  ? "border-amber-400 bg-amber-400 text-black shadow-sm font-black"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DEFAULT_VEHICLE_OPTIONS = [
  { id: "bike", label: "Motorcycle", hint: "Petrol / Standard Bike" },
  { id: "scooter", label: "Scooter / Activa", hint: "Non-geared Scooter" },
  { id: "ev", label: "Electric 2W", hint: "EV Bike / Scooter" },
  { id: "bicycle", label: "Bicycle / E-Cycle", hint: "Eco-friendly" },
];

export function VehiclePicker({
  options = DEFAULT_VEHICLE_OPTIONS,
  value,
  selected,
  onChange,
}: {
  options?: readonly { id: string; label: string; hint: string }[];
  value?: string;
  selected?: string;
  onChange: (next: string) => void;
}) {
  const active = selected !== undefined ? selected : value;

  return (
    <div>
      <label className="text-[0.72rem] font-bold text-foreground">Select Vehicle Type</label>
      <div role="radiogroup" aria-label="Vehicle type" className="mt-1.5 grid gap-2 grid-cols-2">
        {options.map((option) => {
          const isSel = active === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSel}
              onClick={() => onChange(option.id)}
              className={`rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.97] ${
                isSel
                  ? "border-amber-400 bg-amber-500/10 shadow-sm ring-1 ring-amber-400"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <p className="text-xs font-black tracking-tight text-foreground">{option.label}</p>
              <p className="mt-0.5 text-[0.65rem] font-medium text-muted-foreground">{option.hint}</p>
            </button>
          );
        })}
      </div>
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  items,
  stepId,
}: {
  title: string;
  onEdit: (stepId: number) => void;
  stepId: number;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border p-4 bg-card shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <button
          type="button"
          onClick={() => onEdit(stepId)}
          className="rounded-full bg-amber-500/10 px-3 py-1 text-[0.66rem] font-bold text-amber-600 dark:text-amber-400 transition-all active:scale-95 hover:bg-amber-500/20"
        >
          Edit
        </button>
      </div>
      <dl className="mt-2.5 space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-3 border-b border-border/50 py-1.5 last:border-b-0">
            <dt className="text-[0.7rem] font-medium text-muted-foreground">{item.label}</dt>
            <dd className="max-w-[60%] text-right text-[0.72rem] font-bold tracking-tight text-foreground">
              {item.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
