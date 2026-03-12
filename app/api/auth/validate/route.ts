/**
 * Validate session proxy — forwards to backend with cookies.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {};
  const cookie = request.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;
  const ua = request.headers.get("user-agent");
  if (ua) headers["User-Agent"] = ua;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) headers["X-Forwarded-For"] = xff;

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/validate`, {
    headers,
    cache: "no-store",
  });
  const body = await backendRes.text();

  const res = new NextResponse(body, {
    status: backendRes.status,
    headers: { "Content-Type": "application/json" },
  });

  for (const c of backendRes.headers.getSetCookie()) {
    res.headers.append("Set-Cookie", c);
  }

  return res;
}
