import { Skeleton } from "@shared/ui/skeleton";

/** Sprint 3.10 — skeleton loading for the Settings module. */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading settings">
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-9 w-48 rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
