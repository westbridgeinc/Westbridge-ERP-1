/**
 * Runs once when the Next.js server starts. Validates required env; loads Sentry for server/edge.
 */

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    const { initTelemetry } = await import("./lib/telemetry");
    await initTelemetry();
    const { validateEnv } = await import("./lib/env");
    const result = validateEnv();
    if (!result.ok) {
      const msg = `Missing required environment variables: ${result.missing.join(", ")}. Check .env or .env.example.`;
      if (process.env.NODE_ENV === "production") {
        throw new Error(msg);
      }
      // eslint-disable-next-line no-console
      console.error(msg);
    }
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
