// Sentry client-side initialization is handled in sentry.client.config.ts
// (loaded automatically by @sentry/nextjs via withSentryConfig in next.config.ts).
// Do NOT add Sentry.init() here — it would cause duplicate error reports and wasted quota.

import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
