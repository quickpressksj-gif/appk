import { Inbox, PowerOff, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@shared/ui/skeleton";

/* ---------------------------------------------------------- Empty states */

function EmptyShell({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-soft animate-rise flex flex-col items-center border border-border px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="mt-4 text-sm font-black tracking-tight text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function NoOrdersEmptyState() {
  return (
    <EmptyShell
      icon={<Inbox className="size-6" />}
      title="No live orders right now"
      body="New pickups will appear here the moment a customer books with your shop."
    />
  );
}

export function OfflineEmptyState({ onGoOnline }: { onGoOnline: () => void }) {
  return (
    <EmptyShell
      icon={<PowerOff className="size-6" />}
      title="You're offline"
      body="Customers can't book your shop while you're offline. Go online to start receiving orders."
      action={
        <button
          type="button"
          onClick={onGoOnline}
          className="rounded-full bg-brand-dark px-4 py-2 text-[0.7rem] font-bold text-background transition-all duration-300 active:scale-[0.95]"
        >
          Go online
        </button>
      }
    />
  );
}

export function MaintenanceEmptyState() {
  return (
    <EmptyShell
      icon={<Wrench className="size-6" />}
      title="Scheduled maintenance"
      body="Order intake is paused for a short QuickPress maintenance window. We'll be back shortly."
    />
  );
}

/* -------------------------------------------------------------- Skeleton */

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 px-4 pb-32 pt-4 md:px-6">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-52 w-full rounded-3xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
