"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { ROUTES } from "@/lib/config/site";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, { extra: { boundary: "dashboard" } });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-6">
      <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 max-w-md text-center text-base text-muted-foreground">
        We couldn’t load this section. You can try again or go back to the dashboard.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href={ROUTES.dashboard}
          prefetch={true}
          className="rounded-md border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
