import { Skeleton } from "@shared/ui/skeleton";

/** Sprint 3.8 — skeleton loaders for notifications, threads and chat. */
export function NotificationListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full rounded-2xl" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-3xl" />
      ))}
    </div>
  );
}

export function ThreadListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-3xl" />
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-3/4 rounded-3xl" />
      <Skeleton className="ml-auto h-16 w-2/3 rounded-3xl" />
      <Skeleton className="h-24 w-1/2 rounded-3xl" />
      <Skeleton className="ml-auto h-12 w-2/5 rounded-3xl" />
    </div>
  );
}