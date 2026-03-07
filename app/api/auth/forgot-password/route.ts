/**
 * POST /api/auth/forgot-password — request a password reset email.
 * Always returns 200 to prevent user enumeration.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requestPasswordReset } from "@/lib/services/password-reset.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, checkEmailRateLimit, getClientIdentifier } from "@/lib/api/rate-limit-tiers";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const { allowed } = await checkTieredRateLimit(getClientIdentifier(request), "anonymous", "/api/auth/forgot-password");
    if (!allowed) {
      // Still return 200 to avoid enumeration via timing
      return NextResponse.json(apiSuccess({ sent: true }, meta()), { headers: headers() });
    }

    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get("x-csrf-token") ?? request.headers.get("X-CSRF-Token");
    if (!validateCsrf(csrfHeader, csrfCookie)) {
      return NextResponse.json(
        apiError("FORBIDDEN", "Invalid or missing CSRF token.", undefined, meta()),
        { status: 403, headers: headers() }
      );
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json(apiError("INVALID_JSON", "Invalid request body", undefined, meta()), { status: 400, headers: headers() });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", "Valid email required", undefined, meta()), { status: 400, headers: headers() });
    }

    const emailRateLimit = await checkEmailRateLimit(parsed.data.email);
    if (!emailRateLimit.allowed) {
      // Still return 200 to avoid enumeration
      return NextResponse.json(apiSuccess({ sent: true }, meta()), { headers: headers() });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await requestPasswordReset(parsed.data.email, baseUrl);

    // Always return success — never reveal whether the email exists
    return NextResponse.json(apiSuccess({ sent: true }, meta()), { headers: headers() });
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    // Still return 200 — don't leak server errors for this endpoint
    return NextResponse.json(apiSuccess({ sent: true }, meta()), { headers: headers() });
  }
}
