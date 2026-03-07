"use client";

import { type HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional: custom width (e.g. "60%", "120px") */
  width?: string | number;
  /** Optional: custom height (e.g. "20px", 16) */
  height?: string | number;
}

export function Skeleton({
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden animate-pulse rounded-md bg-muted ${className}`}
      style={{
        width: width != null ? (typeof width === "number" ? `${width}px` : width) : undefined,
        height: height != null ? (typeof height === "number" ? `${height}px` : height) : undefined,
        ...style,
      }}
      {...props}
    >
      <div className="skeleton-shimmer-overlay" aria-hidden />
    </div>
  );
}

/** Shimmer overlay for skeleton (use on a parent with overflow-hidden) */
export function SkeletonShimmer() {
  return (
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
      aria-hidden
    />
  );
}

/** Skeleton card for dashboard metric cards */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-6 ${className}`}
    >
      <Skeleton height={12} width={100} />
      <Skeleton height={28} width={140} className="mt-3" />
      <Skeleton height={12} width={120} className="mt-2" />
    </div>
  );
}

/** Skeleton chart placeholder */
export function SkeletonChart({ height = 256, className = "" }: { height?: number; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-6 ${className}`}
    >
      <Skeleton height={16} width={120} />
      <Skeleton height={12} width={80} className="mt-1" />
      <Skeleton height={height} width="100%" className="mt-4 rounded-md" />
    </div>
  );
}

/** Skeleton list with configurable row count */
export function SkeletonList({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-border divide-y divide-border bg-card ${className}`}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton height={14} width={80} />
          <Skeleton height={14} width={160} />
          <Skeleton height={14} width={100} className="ml-auto" />
        </div>
      ))}
    </div>
  );
}
