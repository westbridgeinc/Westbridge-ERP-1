"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/analytics/posthog.client";

/**
 * Initialises PostHog on the client. Mount this once near the root.
 * Intentionally a thin wrapper — no children, no context — to keep
 * bundle impact minimal.
 */
export function PHProvider() {
  useEffect(() => {
    initPostHog();
  }, []);

  return null;
}
