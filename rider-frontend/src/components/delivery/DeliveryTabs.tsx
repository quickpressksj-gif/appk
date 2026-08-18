import { useEffect, useState } from "react";

import {
  DELIVERY_TABS,
  type DeliveryOrder,
  type DeliveryStatus,
} from "../../data/rider-delivery-mock";

/** Animated badge count — pops whenever the number changes. */
function TabBadge({ count, active }: { count: number; active: boolean }) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setPulseKey((key) => key + 1);
  }, [count]);

  return (
    <span
      key={pulseKey}
      className={`animate-badge-pop ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.6rem] font-black tabular-nums ${
        active ? "bg-brand-dark text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      {count}
    </span>
  );
}

export function DeliveryTabs({
  active,
  onChange,
  deliveries,
}: {
  active: DeliveryStatus;
  onChange: (next: DeliveryStatus) => void;
  deliveries: DeliveryOrder[];
}) {
  return (
    <div
      role="tablist"
      aria-label="Delivery status"
      className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible"
    >
      {DELIVERY_TABS.map((tab) => {
        const count = deliveries.filter((item) => item.status === tab.id).length;
        const isActive = active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center rounded-full px-3.5 py-2.5 text-xs font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${
              isActive
                ? "bg-primary text-primary-foreground shadow-cta"
                : "border border-border bg-card text-muted-foreground hover:border-primary/60"
            }`}
          >
            <span className="sm:hidden">{tab.short}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <TabBadge count={count} active={isActive} />
          </button>
        );
      })}
    </div>
  );
}
