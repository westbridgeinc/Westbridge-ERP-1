/**
 * Logout proxy — forwards to backend and copies Set-Cookie (clear) headers.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const cookie = request.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;
  const csrf = request.headers.get("x-csrf-token");
  if (csrf) headers["x-csrf-token"] = csrf;
  const ua = request.headers.get("user-agent");
  if (ua) headers["User-Agent"] = ua;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) headers["X-Forwarded-For"] = xff;

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method: "POST",
    headers,
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
