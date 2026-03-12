import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    environment: process.env.NODE_ENV ?? "development",
    beforeSend(event) {
      if (event.request?.cookies) {
        (event.request.cookies as unknown) = "[REDACTED]";
      }
      if (event.request?.data && typeof event.request.data === "object") {
        const data = event.request.data as Record<string, unknown>;
        for (const key of ["password", "token", "secret", "key", "authorization"]) {
          if (key in data) data[key] = "[REDACTED]";
        }
      }
      return event;
    },
  });
}
