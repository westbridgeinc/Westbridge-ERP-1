import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE } from "@/lib/constants";

// Tokens are base64url — only these characters are valid.
const SESSION_TOKEN_REGEX = /^[A-Za-z0-9\-_]+$/;

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(COOKIE.SESSION_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!SESSION_TOKEN_REGEX.test(sessionToken)) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE.SESSION_NAME);
      return response;
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
        return response;
      }
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE.SESSION_NAME);
      return response;
    }
  }

  if (pathname === "/login" && sessionToken) {
    if (!SESSION_TOKEN_REGEX.test(sessionToken)) {
      const response = NextResponse.next();
      response.cookies.delete(COOKIE.SESSION_NAME);
      return response;
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
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Cannot validate — stay on /login.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
