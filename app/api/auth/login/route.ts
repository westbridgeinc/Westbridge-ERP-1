/**
 * Login proxy route handler.
 * Forwards login to backend. On success, extracts the session token
 * from the Set-Cookie header and includes it in the JSON response
 * so the client can redirect to /api/auth/session?token=... to set
 * the httpOnly cookie via a navigation request.
 */
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const csrfToken = request.headers.get("x-csrf-token");
    if (csrfToken) headers["x-csrf-token"] = csrfToken;

    const userAgent = request.headers.get("user-agent");
    if (userAgent) headers["User-Agent"] = userAgent;

    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    // Forward X-Forwarded-For so session fingerprint matches
    // what the middleware sends during validation.
    const xff = request.headers.get("x-forwarded-for");
    if (xff) headers["X-Forwarded-For"] = xff;

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers,
      body,
    });

    const responseBody = await backendRes.text();

    if (backendRes.ok) {
      // Extract session token from Set-Cookie header
      let sessionToken = "";
      for (const cookie of backendRes.headers.getSetCookie()) {
        const match = cookie.match(/westbridge_sid=([^;]+)/);
        if (match) {
          sessionToken = match[1];
          break;
        }
      }

      // Return the session token in the body so client can navigate to set it
      const data = JSON.parse(responseBody);
      data.data.sessionToken = sessionToken;

      const responseHeaders = new Headers({
        "Content-Type": "application/json",
      });

      // Also try to pass through Set-Cookie
      for (const cookie of backendRes.headers.getSetCookie()) {
        responseHeaders.append("Set-Cookie", cookie);
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: responseHeaders,
      });
    }

    return new Response(responseBody, {
      status: backendRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
