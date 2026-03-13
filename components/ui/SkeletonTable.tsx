"use client";

import { Skeleton } from "./Skeleton";

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 5, className = "" }: SkeletonTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-border ${className}`}
      role="status"
      aria-label="Loading table data"
      aria-busy="true"
    >
      <div className="border-b border-border bg-muted px-6 py-3">
        <div className="flex items-center gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-3 ${i === 0 ? "w-[100px]" : i === columns - 1 ? "w-[80px]" : "w-[120px]"}`}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex items-center gap-6 border-b border-border px-6 py-4">
          {Array.from({ length: columns }).map((_, ci) => (
            <Skeleton
              key={ci}
              className={`h-3.5 ${ci === 0 ? "w-[90px]" : ci === 1 ? "w-[160px]" : ci === columns - 1 ? "w-[70px]" : "w-[100px]"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
