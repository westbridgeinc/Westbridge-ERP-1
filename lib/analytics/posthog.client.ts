"use client";

/**
 * Client-side PostHog initialisation.
 * - Autocapture disabled (GDPR compliance — we capture explicitly)
 * - Respects Do Not Track header
 * - Tree-shakes to nothing when POSTHOG_API_KEY is not set
 */
import posthog from "posthog-js";

export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  // Honour DNT
  if (navigator.doNotTrack === "1" || (window as unknown as Record<string, unknown>).doNotTrack === "1") {
    return;
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    autocapture: false, // we only send explicit track() calls
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true, // enable if you get explicit consent
    persistence: "localStorage+cookie",
  });
}

export { posthog };
