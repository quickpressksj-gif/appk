/** Loading skeletons matching the notifications, announcements and chat layouts. */
export function NotificationListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-5 pt-4">
      <div className="h-12 animate-pulse rounded-2xl bg-muted" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-9 w-20 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card-soft flex gap-3 border border-border p-4">
          <div className="size-10 shrink-0 animate-pulse rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnnouncementSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-5 pt-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card-soft space-y-2 border border-border p-5">
          <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-3 px-5 pt-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={`h-14 animate-pulse rounded-3xl bg-muted ${
            index % 2 === 0 ? "mr-16" : "ml-16"
          }`}
        />
      ))}
    </div>
  );
}