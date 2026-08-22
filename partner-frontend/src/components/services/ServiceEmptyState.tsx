import { PackageOpen, SearchX, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ServiceEmptyVariant = "no-services" | "no-results" | "offline";

const VARIANTS: Record<
  ServiceEmptyVariant,
  { icon: LucideIcon; title: string; body: string; cta: string }
> = {
  "no-services": {
    icon: PackageOpen,
    title: "No services yet",
    body: "Add your first service to publish a rate card customers can order from.",
    cta: "+ Add Service",
  },
  "no-results": {
    icon: SearchX,
    title: "No matching services",
    body: "Try another service name or category — or clear the filters you've applied.",
    cta: "Clear search & filters",
  },
  offline: {
    icon: WifiOff,
    title: "You're offline",
    body: "Your rate card can't sync right now. Reconnect and we'll load the latest prices.",
    cta: "Try again",
  },
};

export function ServiceEmptyState({
  variant,
  isSearching,
  onAction,
}: {
  variant?: ServiceEmptyVariant;
  isSearching?: boolean;
  onAction?: () => void;
}) {
  const resolvedVariant: ServiceEmptyVariant =
    variant ?? (isSearching ? "no-results" : "no-services");
  const config = VARIANTS[resolvedVariant] || VARIANTS["no-services"];
  const Icon = config.icon || PackageOpen;

  return (
    <div className="card-soft animate-soft-fade flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm">
      <span
        className={`flex size-14 items-center justify-center rounded-3xl ${
          resolvedVariant === "offline"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/20 text-brand-dark"
        }`}
      >
        <Icon className="size-6" />
      </span>
      <p className="mt-4 text-sm font-black tracking-tight text-foreground">{config.title}</p>
      <p className="mt-1 max-w-xs text-xs font-medium text-muted-foreground">{config.body}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-black tracking-tight text-brand-dark shadow-sm transition-all hover:brightness-105 active:scale-95"
        >
          {config.cta}
        </button>
      ) : null}
    </div>
  );
}
