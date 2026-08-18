import { Bike, FileText, Info, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { ManagedOrder } from "../../data/partner-orders-mock";

function Sheet({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="animate-sheet-up relative w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-soft sm:rounded-3xl">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
              {icon}
            </span>
            <h3 className="truncate text-sm font-black tracking-tight text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

const REJECT_REASONS = [
  "Store at full capacity",
  "Outside my pickup radius",
  "Items not serviced here",
  "Pickup slot unavailable",
];

export function RejectOrderSheet({
  order,
  onClose,
  onConfirm,
}: {
  order: ManagedOrder;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState(REJECT_REASONS[0] ?? "");

  return (
    <Sheet title={`Reject ${order.code}`} icon={<X className="size-4" />} onClose={onClose}>
      <div className="space-y-2">
        {REJECT_REASONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setReason(option)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-bold tracking-tight transition-all duration-300 ${
              reason === option
                ? "border-primary bg-primary/10 text-brand-dark"
                : "border-border bg-card text-muted-foreground hover:border-primary/60"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onConfirm(reason)}
        className="ripple mt-4 w-full rounded-2xl border border-destructive/30 bg-destructive/10 py-3.5 text-sm font-black tracking-tight text-destructive transition-all duration-300 active:scale-[0.97]"
      >
        Confirm rejection
      </button>
    </Sheet>
  );
}

const RIDERS = [
  { id: "r1", name: "Sanjay K.", eta: "6 min away", rating: 4.8 },
  { id: "r2", name: "Rajesh P.", eta: "11 min away", rating: 4.6 },
  { id: "r3", name: "Imtiaz A.", eta: "18 min away", rating: 4.9 },
];

export function AssignRiderSheet({
  order,
  onClose,
  onAssign,
}: {
  order: ManagedOrder;
  onClose: () => void;
  onAssign: (riderName: string) => void;
}) {
  return (
    <Sheet title={`Assign rider · ${order.code}`} icon={<Bike className="size-4" />} onClose={onClose}>
      <p className="mb-3 text-[0.7rem] font-semibold text-muted-foreground">
        Rider allocation is a UI placeholder — dispatch will be wired to the rider network later.
      </p>
      <div className="space-y-2">
        {RIDERS.map((rider) => (
          <button
            key={rider.id}
            type="button"
            onClick={() => onAssign(rider.name)}
            className="ripple flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.98]"
          >
            <span className="min-w-0">
              <span className="block truncate text-xs font-black tracking-tight text-foreground">
                {rider.name}
              </span>
              <span className="block text-[0.68rem] font-semibold text-muted-foreground">
                {rider.eta} · ★ {rider.rating}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-[0.65rem] font-bold text-brand-dark">
              Assign
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function InvoiceSheet({ order, onClose }: { order: ManagedOrder; onClose: () => void }) {
  return (
    <Sheet title="Invoice preview" icon={<FileText className="size-4" />} onClose={onClose}>
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
          Invoice placeholder
        </p>
        <p className="mt-1 text-sm font-black tracking-tight text-foreground">
          {order.invoiceNo ?? `INV-DRAFT-${order.code}`}
        </p>
        <dl className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
          <div className="flex justify-between">
            <dt>Order</dt>
            <dd className="text-foreground">{order.code}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Customer</dt>
            <dd className="text-foreground">{order.customerName}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Total billed</dt>
            <dd className="text-foreground">₹{order.charges.total.toLocaleString("en-IN")}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[0.68rem] font-medium text-muted-foreground">
          PDF generation will be added when billing APIs are connected.
        </p>
      </div>
    </Sheet>
  );
}

export function CancelReasonSheet({ order, onClose }: { order: ManagedOrder; onClose: () => void }) {
  return (
    <Sheet title="Cancellation reason" icon={<Info className="size-4" />} onClose={onClose}>
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-xs font-bold tracking-tight text-destructive">
          {order.cancelReason ?? "No reason recorded for this order."}
        </p>
        <p className="mt-2 text-[0.68rem] font-semibold text-muted-foreground">
          {order.code} · {order.placedAt}
        </p>
      </div>
    </Sheet>
  );
}
