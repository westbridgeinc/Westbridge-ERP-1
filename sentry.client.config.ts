import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.05,
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
    environment: process.env.NODE_ENV ?? "development",
    integrations: (integrations) => integrations.filter((i) => i.name !== "Feedback"),
    beforeSend(event) {
      if (event.request?.cookies) (event.request as { cookies?: unknown }).cookies = "[REDACTED]";
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown> | undefined;
        if (data && typeof data === "object") {
          ["password", "token", "secret", "key", "authorization"].forEach((k) => {
            if (k in data) data[k] = "[REDACTED]";
          });
        }
      }
      return event;
    },
  });
}
