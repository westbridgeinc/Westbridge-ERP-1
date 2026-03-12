/**
 * CSRF proxy — forwards to backend and passes through Set-Cookie headers.
 */
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = {};
    const cookie = request.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const backendRes = await fetch(`${BACKEND_URL}/api/csrf`, { headers });
    const body = await backendRes.text();

    const responseHeaders = new Headers({
      "Content-Type": "application/json",
    });

    for (const c of backendRes.headers.getSetCookie()) {
      responseHeaders.append("Set-Cookie", c);
    }

    return new Response(body, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
