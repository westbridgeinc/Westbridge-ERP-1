import Link from "next/link";
import { ROUTES, SITE } from "@/lib/config/site";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <p className="text-sm font-semibold uppercase tracking-brand text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl font-display">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-center text-base text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href={ROUTES.dashboard}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
        <Link
          href={ROUTES.home}
          className="rounded-md border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
        >
          Back to {SITE.name}
        </Link>
      </div>
    </div>
  );
}
