/**
 * Web Vitals tracking.
 * Export `reportWebVitals` from app/layout.tsx (Next.js convention).
 */

export interface WebVitalMetric {
  name: "CLS" | "FID" | "FCP" | "LCP" | "TTFB" | "INP";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType?: string;
  id?: string;
}

/**
 * Send a Web Vital metric to the analytics endpoint.
 * Called automatically by Next.js when the user navigates.
 */
export function reportWebVitals(metric: WebVitalMetric): void {
  // Send to /api/analytics/vitals (built in Phase 11)
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/vitals",
      JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
        url: typeof window !== "undefined" ? window.location.pathname : "",
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Performance budgets — fail CI if these thresholds are exceeded.
 */
export const PERFORMANCE_BUDGETS = {
  LCP:  2500, // ms
  CLS:  0.1,  // score
  INP:  200,  // ms
  FCP:  1800, // ms
  TTFB: 800,  // ms
} as const;

export function isWithinBudget(metric: WebVitalMetric): boolean {
  const budget = PERFORMANCE_BUDGETS[metric.name as keyof typeof PERFORMANCE_BUDGETS];
  if (budget === undefined) return true;
  return metric.value <= budget;
}
