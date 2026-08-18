import { ORDER_TABS, type OrderStage } from "../../data/partner-orders-mock";

/** Horizontally scrollable stage tabs with live badge counts. */
export function OrderTabs({
  active,
  counts,
  onChange,
}: {
  active: OrderStage;
  counts: Record<OrderStage, number>;
  onChange: (stage: OrderStage) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Order stages"
      className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {ORDER_TABS.map((tab) => {
        const isActive = tab.id === active;
        const count = counts[tab.id];
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`ripple flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
              isActive
                ? "border-primary bg-primary/15 text-brand-dark"
                : "border-border bg-card text-muted-foreground hover:border-primary/60"
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
            <span
              className={`min-w-5 rounded-full px-1.5 py-0.5 text-[0.6rem] font-black tabular-nums ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
