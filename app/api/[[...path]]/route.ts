/**
 * Catch-all API proxy route handler.
 * Proxies all /api/* requests (that don't have their own route handler)
 * to the backend, forwarding cookies and security headers.
 *
 * Specific routes like /api/auth/* and /api/csrf have their own route
 * handlers that take precedence over this catch-all.
 */
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

async function proxyRequest(request: NextRequest) {
  const url = new URL(request.url);
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
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { code: "PROXY_ERROR", message: String(e) } }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
