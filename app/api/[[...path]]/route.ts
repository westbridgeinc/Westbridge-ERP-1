/**
 * Catch-all API proxy route handler.
 * Proxies allowed /api/* requests to the backend, forwarding cookies and security headers.
 *
 * Only paths matching ALLOWED_PATH_PREFIXES are forwarded. All other paths
 * return 404 to prevent exposure of internal backend routes.
 */
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

/**
 * Allowlist of API path prefixes that may be proxied to the backend.
 * Any request whose pathname does not start with one of these is rejected.
 */
const ALLOWED_PATH_PREFIXES = [
  "/api/erp/",
  "/api/invite",
  "/api/admin/",
  "/api/audit/",
  "/api/team/",
  "/api/account/",
  "/api/billing/",
  "/api/ai/",
  "/api/analytics/",
  "/api/health/",
  "/api/events/",
  "/api/webhooks/",
  "/api/reports/",
  "/api/leads/",
  "/api/signup",
  "/api/modules",
  "/api/flags",
] as const;

function isAllowedPath(pathname: string): boolean {
  return ALLOWED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function proxyRequest(request: NextRequest) {
  const url = new URL(request.url);

  // Reject paths not in the allowlist
  if (!isAllowedPath(url.pathname)) {
    return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Route not found" } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const headers: Record<string, string> = {};

  // Forward essential headers for auth and fingerprint matching
  const cookie = request.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  const ua = request.headers.get("user-agent");
  if (ua) headers["User-Agent"] = ua;

  const xff = request.headers.get("x-forwarded-for");
  if (xff) headers["X-Forwarded-For"] = xff;

  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const csrfToken = request.headers.get("x-csrf-token");
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Forward body for non-GET/HEAD requests
    if (request.method !== "GET" && request.method !== "HEAD") {
      fetchOptions.body = await request.text();
    }

    const backendRes = await fetch(backendUrl, fetchOptions);
    const body = await backendRes.text();

    const responseHeaders = new Headers({
      "Content-Type": backendRes.headers.get("content-type") ?? "application/json",
    });

    // Forward Set-Cookie headers from backend
    for (const c of backendRes.headers.getSetCookie()) {
      responseHeaders.append("Set-Cookie", c);
    }

    return new Response(body, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch {
    // Never expose internal error details to the client (CodeQL: js/stack-trace-exposure)
    return new Response(
      JSON.stringify({ error: { code: "PROXY_ERROR", message: "Unable to reach backend service" } }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
