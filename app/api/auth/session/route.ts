/**
 * POST /api/auth/session — Sets the session cookie from a token provided in the request body.
 * Called after successful login to set the httpOnly cookie via a fetch request.
 *
 * Replaces the previous GET-with-token-in-URL approach to prevent session tokens
 * from appearing in browser history, server logs, and referrer headers.
 */
import { NextRequest, NextResponse } from "next/server";

const SESSION_TOKEN_REGEX = /^[A-Za-z0-9\-_]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string; redirect?: string };
    const token = body?.token;
    const redirect = body?.redirect ?? "/dashboard";

    if (!token || typeof token !== "string" || !SESSION_TOKEN_REGEX.test(token)) {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Invalid or missing session token" } },
        { status: 400 },
      );
    }

    const res = NextResponse.json({ data: { success: true, redirect } });
    res.cookies.set("westbridge_sid", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "Invalid request body" } }, { status: 400 });
  }
}
