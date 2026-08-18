import {
  Camera,
  ChevronUp,
  FileText,
  MessageCircle,
  Navigation2,
  Phone,
  Store,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DeliveryOrder, DeliveryTimelineStep } from "../../data/rider-delivery-mock";
import { NavProgressTracker } from "./NavProgressTracker";

function SheetAction({
  icon: Icon,
  label,
  onPress,
  tone = "outline",
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  tone?: "primary" | "green" | "outline";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary text-primary-foreground shadow-cta"
      : tone === "green"
        ? "bg-secondary/12 text-brand-green border border-secondary/30"
        : "border border-border bg-card text-foreground";

  return (
    <button
      type="button"
      onClick={onPress}
      className={`ripple flex min-h-14 items-center gap-2 rounded-2xl px-3 py-3 text-left text-[0.74rem] font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${toneClass}`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={2.2} />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

/** Large bottom action sheet with the full trip control set. */
export function NavActionSheet({
  delivery,
  steps,
  expanded,
  onToggle,
  onNavigatePickup,
  onNavigateCustomer,
  onCallCustomer,
  onCallPartner,
  onChatCustomer,
  onChatPartner,
  onViewOrder,
  onProof,
}: {
  delivery: DeliveryOrder;
  steps: DeliveryTimelineStep[];
  expanded: boolean;
  onToggle: () => void;
  onNavigatePickup: () => void;
  onNavigateCustomer: () => void;
  onCallCustomer: () => void;
  onCallPartner: () => void;
  onChatCustomer: () => void;
  onChatPartner: () => void;
  onViewOrder: () => void;
  onProof: () => void;
}) {
  return (
    <section className="animate-sheet-up glass-panel rounded-t-4xl px-4 pb-5 pt-3 shadow-soft">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="mx-auto flex min-h-11 w-full max-w-40 flex-col items-center justify-center"
      >
        <span className="block h-1 w-12 rounded-full bg-border" />
        <span className="mt-1 flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          {expanded ? "Collapse" : "Trip actions"}
          <ChevronUp
            className={`size-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <NavProgressTracker steps={steps} />

      {expanded ? (
        <div className="animate-expand mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          <SheetAction
            icon={Navigation2}
            label="Navigate to Pickup"
            tone="primary"
            onPress={onNavigatePickup}
          />
          <SheetAction
            icon={Navigation2}
            label="Navigate to Customer"
            tone="primary"
            onPress={onNavigateCustomer}
          />
          <SheetAction icon={Phone} label="Call Customer" tone="green" onPress={onCallCustomer} />
          <SheetAction icon={Store} label="Call Partner" tone="green" onPress={onCallPartner} />
          <SheetAction icon={MessageCircle} label="Chat Customer" onPress={onChatCustomer} />
          <SheetAction icon={UserRound} label="Chat Partner" onPress={onChatPartner} />
          <SheetAction icon={FileText} label="View Order Details" onPress={onViewOrder} />
          <SheetAction icon={Camera} label="Delivery Proof" onPress={onProof} />
        </div>
      ) : (
        <div className="animate-soft-fade mt-3 grid grid-cols-2 gap-2">
          <SheetAction
            icon={Navigation2}
            label={delivery.status === "on-the-way" ? "Navigate to Customer" : "Navigate to Pickup"}
            tone="primary"
            onPress={delivery.status === "on-the-way" ? onNavigateCustomer : onNavigatePickup}
          />
          <SheetAction icon={Phone} label="Call Customer" tone="green" onPress={onCallCustomer} />
        </div>
      )}
    </section>
  );
}
