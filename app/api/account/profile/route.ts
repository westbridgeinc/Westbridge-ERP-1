import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { validateSession } from "@/lib/services/session.service";
import { validateCsrf } from "@/lib/csrf";
import { checkTieredRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { prisma } from "@/lib/data/prisma";
import { apiSuccess, apiError, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { COOKIE } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(1).max(120).trim(),
});

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);
  const hdrs = { ...securityHeaders() };
  const meta = { request_id: requestId };

  const cookieStore = await cookies();

  // CSRF validation
  const headerToken = request.headers.get("X-CSRF-Token");
  const cookieToken = cookieStore.get(COOKIE.CSRF_NAME)?.value ?? null;
  if (!validateCsrf(headerToken, cookieToken)) {
    return NextResponse.json(
      apiError("CSRF_INVALID", "Invalid or missing CSRF token", undefined, meta),
      { status: 403, headers: hdrs }
    );
  }

  // Session validation
  const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  if (!token) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Authentication required", undefined, meta), { status: 401, headers: hdrs });
  }
  const sessionResult = await validateSession(token, request);
  if (!sessionResult.ok) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Authentication required", undefined, meta), { status: 401, headers: hdrs });
  }
  const session = sessionResult.data;

  const rateLimit = await checkTieredRateLimit(session.userId, "authenticated", "/api/account/profile");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError("RATE_LIMITED", "Too many requests. Please try again shortly.", undefined, meta),
      { status: 429, headers: { ...hdrs, ...rateLimitHeaders(rateLimit) } }
    );
  }

  // Parse and validate body
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("INVALID_REQUEST", "Name is required and must be under 120 characters.", undefined, meta),
      { status: 400, headers: hdrs }
    );
  }

  const { name } = parsed.data;

  await prisma.user.update({
    where: { id: session.userId },
    data: { name },
  });

  return NextResponse.json(apiSuccess({ name }, meta), { headers: hdrs });
}
