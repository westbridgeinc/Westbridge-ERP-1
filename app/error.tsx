"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { ROUTES, SITE } from "@/lib/config/site";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { extra: { boundary: "route" } });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-center text-base text-muted-foreground">
        We could not load this page. You can try again or return home.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs font-mono text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-4">
        <button type="button" onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Try again
        </button>
        <Link href={ROUTES.home} className="rounded-md border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80">
          Back to {SITE.name}
        </Link>
      </div>
    </div>
  );
}
