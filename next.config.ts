import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  outputFileTracingRoot: path.join(process.cwd()),
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    // Next.js injects inline scripts for hydration/data. Without nonce-based CSP
    // middleware, 'unsafe-inline' is required in production. TODO: migrate to
    // nonce-based CSP via Next.js middleware for stricter script-src.
    const scriptSrc = isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";
    // connect-src: allow self + backend API + Sentry + PostHog. Avoids blanket https:.
    const apiHost = process.env.NEXT_PUBLIC_API_URL ?? "";
    const sentryDsn = process.env.SENTRY_DSN ?? "";
    const posthogHost = process.env.POSTHOG_HOST ?? "https://app.posthog.com";
    const connectSrcParts = ["'self'"];
    if (apiHost) connectSrcParts.push(apiHost);
    if (sentryDsn) connectSrcParts.push("https://*.ingest.sentry.io");
    if (posthogHost) connectSrcParts.push(posthogHost);
    // PowerTranz for payment processing
    connectSrcParts.push("https://staging.ptranz.com", "https://ptranz.com");
    const cspParts = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src ${connectSrcParts.join(" ")}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    if (isProd) {
      cspParts.push("upgrade-insecure-requests", "block-all-mixed-content");
    }
    const csp = cspParts.join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
