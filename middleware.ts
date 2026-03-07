import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE } from "@/lib/constants";

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(COOKIE.SESSION_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Validate the session is real, not expired, and not revoked
    try {
      const validateUrl = new URL("/api/auth/validate", request.url);
      const res = await fetch(validateUrl.toString(), {
        method: "GET",
        headers: {
          Cookie: `${COOKIE.SESSION_NAME}=${sessionToken}`,
          "User-Agent": request.headers.get("user-agent") ?? "",
          "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        // Session is invalid — redirect to login and clear the stale cookie
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete(COOKIE.SESSION_NAME);
        return response;
      }
    } catch {
      // Validation service is unavailable — fail open for availability.
      // Individual route handlers still validate sessions independently.
    }
  }

  if (pathname === "/login" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
