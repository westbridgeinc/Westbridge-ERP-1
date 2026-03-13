import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE } from "@/lib/constants";

// Tokens are base64url — only these characters are valid.
const SESSION_TOKEN_REGEX = /^[A-Za-z0-9\-_]+$/;

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

// ─── CSP helpers ────────────────────────────────────────────────────────────
// NOTE: Next.js injects inline scripts for hydration/data that cannot currently
// be given a nonce.  Until the framework supports nonce propagation to its own
// inline scripts, 'unsafe-inline' is required for script-src in production.
// The CSP is still valuable because it restricts connect-src, frame-ancestors,
// base-uri, form-action, and more — preventing many attack vectors.

const isProd = process.env.NODE_ENV === "production";
const apiHost = process.env.NEXT_PUBLIC_API_URL ?? "";
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
const posthogHost = process.env.POSTHOG_HOST ?? "https://app.posthog.com";

function buildCsp(): string {
  const scriptSrc = isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";

  const styleSrc = "style-src 'self' 'unsafe-inline'";

  const connectSrcParts = ["'self'"];
  if (apiHost) connectSrcParts.push(apiHost);
  if (sentryDsn) connectSrcParts.push("https://*.ingest.sentry.io", "https://*.ingest.de.sentry.io");
  if (posthogHost) connectSrcParts.push(posthogHost);
  // PowerTranz — only expose staging endpoint in non-production
  connectSrcParts.push("https://ptranz.com");
  if (!isProd) connectSrcParts.push("https://staging.ptranz.com");

  const parts = [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrcParts.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (isProd) {
    parts.push("upgrade-insecure-requests");
  }

  return parts.join("; ");
}

// Pre-compute the CSP string (it's the same for every request)
const CSP = buildCsp();

// ─── Middleware ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(COOKIE.SESSION_NAME)?.value;

  // ── Auth: protect /dashboard routes ──────────────────────────────────────

  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
    }

    if (!SESSION_TOKEN_REGEX.test(sessionToken)) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE.SESSION_NAME);
      return addSecurityHeaders(response);
    }

    try {
      const validateUrl = `${BACKEND_URL}/api/auth/validate`;
      const res = await fetch(validateUrl, {
        method: "GET",
        headers: {
          Cookie: `${COOKIE.SESSION_NAME}=${sessionToken}`,
          "User-Agent": request.headers.get("user-agent") ?? "",
          "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });

      if (!res.ok) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete(COOKIE.SESSION_NAME);
        return addSecurityHeaders(response);
      }
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE.SESSION_NAME);
      return addSecurityHeaders(response);
    }
  }

  // ── Auth: redirect logged-in users away from /login ──────────────────────

  if (pathname === "/login" && sessionToken) {
    if (!SESSION_TOKEN_REGEX.test(sessionToken)) {
      const response = NextResponse.next();
      response.cookies.delete(COOKIE.SESSION_NAME);
      return addSecurityHeaders(response);
    }
    try {
      const validateUrl = `${BACKEND_URL}/api/auth/validate`;
      const res = await fetch(validateUrl, {
        method: "GET",
        headers: {
          Cookie: `${COOKIE.SESSION_NAME}=${sessionToken}`,
          "User-Agent": request.headers.get("user-agent") ?? "",
          "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        return addSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
      }
    } catch {
      // Cannot validate — stay on /login.
    }
  }

  // ── Default: add security headers and continue ───────────────────────────

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (isProd) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    {
      source: "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
