import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Metric cards skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="mt-3 h-8 w-20" />
                <Skeleton className="mt-3 h-3 w-16" />
              </div>
              <Skeleton className="ml-4 size-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart skeleton */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-1 h-3 w-32" />
        <Skeleton className="mt-4 h-64 w-full rounded-lg" />
      </div>

      {/* Activity + Quick Actions skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card shadow-sm lg:col-span-2">
          <div className="p-6">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-0 divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                <Skeleton className="size-2 shrink-0 rounded-full" />
                <Skeleton className="h-3.5 flex-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="p-6">
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="flex flex-wrap gap-2 px-6 pb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
