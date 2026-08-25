import {
  Building2,
  ExternalLink,
  Layers,
  Radio,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { getPanelUrls, type PanelInfo } from "../lib/panel-urls";

const ICONS = {
  ShoppingBag,
  Building2,
  Truck,
  ShieldCheck,
};

export function PanelLauncherModal({
  open,
  onClose,
  currentPanel = "customer",
}: {
  open: boolean;
  onClose: () => void;
  currentPanel?: "customer" | "partner" | "rider" | "admin";
}) {
  if (!open) return null;

  const panels = getPanelUrls(currentPanel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-background p-6 shadow-2xl ring-1 ring-border/50 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-foreground">QuickPress Ecosystem</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                  <Radio className="size-2.5 animate-pulse" />
                  Live Network
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground">
                Seamlessly jump to any panel in the platform
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Panels Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {panels.map((panel) => {
            const Icon = ICONS[panel.iconName];
            return (
              <a
                key={panel.id}
                href={panel.url}
                target={panel.isCurrent ? "_self" : "_blank"}
                rel="noreferrer"
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                  panel.isCurrent
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/60 bg-card hover:border-border hover:bg-accent/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${panel.bgLight} ${panel.themeColor}`}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide ${
                        panel.isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-foreground/10 group-hover:text-foreground"
                      }`}
                    >
                      {panel.isCurrent ? "Active Here" : panel.badge}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-black text-foreground group-hover:text-primary transition-colors">
                    {panel.shortName}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-muted-foreground">
                    {panel.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] font-bold text-muted-foreground group-hover:text-foreground">
                  <span className="font-mono text-[10px] opacity-70">
                    Port {panel.devPort}
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    Launch
                    <ExternalLink className="size-3" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/50 p-3 text-[11px] text-muted-foreground">
          <span className="font-semibold">QuickPress Platform Architecture v2.4</span>
          <a
            href="/about"
            onClick={onClose}
            className="font-bold text-primary hover:underline"
          >
            Learn more →
          </a>
        </div>
      </div>
    </div>
  );
}
