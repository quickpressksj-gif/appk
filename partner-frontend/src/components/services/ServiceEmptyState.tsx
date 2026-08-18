import { PackageOpen, SearchX, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ServiceEmptyVariant = "no-services" | "no-results" | "offline";

const VARIANTS: Record<
  ServiceEmptyVariant,
  { icon: LucideIcon; title: string; body: string; cta: string }
> = {
  "no-services": {
    icon: PackageOpen,
    title: "No services yet",
    body: "Add your first service to publish a rate card customers can order from.",
    cta: "Add Service",
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
  onAction,
}: {
  variant: ServiceEmptyVariant;
  onAction?: () => void;
}) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div className="card-soft animate-soft-fade flex flex-col items-center border border-border px-6 py-12 text-center">
      <span
        className={`flex size-14 items-center justify-center rounded-3xl ${
          variant === "offline"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
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
          className="ripple mt-5 rounded-2xl border border-border bg-card px-5 py-2.5 text-xs font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
        >
          {config.cta}
        </button>
      ) : null}
    </div>
  );
}
