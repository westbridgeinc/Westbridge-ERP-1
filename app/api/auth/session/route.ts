/**
 * GET /api/auth/session?token=... — Sets the session cookie and redirects to dashboard.
 * Called after a successful login to set the httpOnly cookie via a navigation (not fetch).
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const redirect = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const res = NextResponse.redirect(new URL(redirect, request.url));
  res.cookies.set("westbridge_sid", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return res;
}
