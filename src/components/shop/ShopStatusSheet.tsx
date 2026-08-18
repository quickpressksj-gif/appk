import { Check } from "lucide-react";

import { SHOP_STATUSES, type ShopStatusId } from "../../data/partner-shop-mock";
import { ShopSheet } from "./ShopSheet";

const TONE_DOT: Record<string, string> = {
  green: "bg-brand-green",
  muted: "bg-muted-foreground",
  amber: "bg-primary",
  red: "bg-destructive",
};

/** Status picker — Online / Offline / Busy / Temporarily Closed / Vacation. */
export function ShopStatusSheet({
  open,
  status,
  onClose,
  onSelect,
}: {
  open: boolean;
  status: ShopStatusId;
  onClose: () => void;
  onSelect: (next: ShopStatusId) => void;
}) {
  return (
    <ShopSheet
      open={open}
      title="Shop Status"
      subtitle="Controls how customers see your shop"
      onClose={onClose}
    >
      <div className="space-y-2.5">
        {SHOP_STATUSES.map((option, index) => {
          const isActive = option.id === status;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(option.id)}
              style={{ animationDelay: `${index * 45}ms` }}
              className={`animate-soft-fade flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 active:scale-[0.98] ${
                isActive ? "border-brand-green bg-secondary/10" : "border-border bg-card hover:border-primary/60"
              }`}
            >
              <span className={`size-2.5 shrink-0 rounded-full ${TONE_DOT[option.tone]}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold tracking-tight text-foreground">
                  {option.label}
                </span>
                <span className="block truncate text-[0.7rem] font-medium text-muted-foreground">
                  {option.description}
                </span>
              </span>
              {isActive ? <Check className="size-4 shrink-0 text-brand-green-dark" /> : null}
            </button>
          );
        })}
      </div>
    </ShopSheet>
  );
}
