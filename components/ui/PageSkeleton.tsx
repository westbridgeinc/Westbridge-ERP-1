"use client";

import { Skeleton } from "./Skeleton";
import { SkeletonTable } from "./SkeletonTable";
import { cn } from "@/lib/utils";

/** Full-page loading skeleton with sidebar placeholder and main content area */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-screen w-full", className)}>
      <div className="hidden w-[260px] shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-16 items-center justify-center border-b border-border p-4">
          <Skeleton height={24} width={48} />
        </div>
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={36} width="100%" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center border-b border-border px-6">
          <Skeleton height={20} width={120} />
        </div>
        <div className="flex-1 overflow-auto p-6">
          <Skeleton height={32} width={200} className="mb-6" />
          <SkeletonTable rows={8} columns={5} />
        </div>
      </div>
    </div>
  );
}
