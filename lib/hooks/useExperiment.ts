"use client";

/**
 * React hook for A/B experiment participation.
 *
 * @example
 * const { variant, trackConversion } = useExperiment("onboarding_checklist_v2", userId);
 * // variant === "control" | "guided_tour"
 */
import { useMemo, useCallback } from "react";
import { assignVariant, trackExposure, trackConversion } from "@/lib/experiments";

export function useExperiment(experimentId: string, userId: string | undefined) {
  const variant = useMemo(() => {
    if (!userId) return "control";
    const v = assignVariant(experimentId, userId);
    trackExposure({ experimentId, variantId: v, userId, timestamp: new Date().toISOString() });
    return v;
  }, [experimentId, userId]);

  const convert = useCallback(
    (eventName: string, value?: number) => {
      if (!userId) return;
      trackConversion({
        experimentId,
        variantId: variant,
        userId,
        eventName,
        value,
        timestamp: new Date().toISOString(),
      });
    },
    [experimentId, variant, userId]
  );

  return { variant, trackConversion: convert };
}
