/**
 * POST /api/auth/reset-password — apply a password reset token.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { applyPasswordReset } from "@/lib/services/password-reset.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { validatePassword } from "@/lib/password-policy";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string(),
});

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const rateLimit = await checkTieredRateLimit(getClientIdentifier(request), "anonymous", "/api/auth/reset-password");
    if (!rateLimit.allowed) {
      return NextResponse.json(apiError("RATE_LIMIT", "Too many attempts. Try again later.", undefined, meta()), { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimit) } });
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
      return NextResponse.json(apiError("VALIDATION_ERROR", "token and password are required", undefined, meta()), { status: 400, headers: headers() });
    }

    const { token, password } = parsed.data;
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", pwCheck.errors[0] ?? "Invalid password", undefined, meta()),
        { status: 400, headers: headers() }
      );
    }

    const result = await applyPasswordReset({ raw: token, newPassword: password });
    if (!result.ok) {
      return NextResponse.json(apiError("RESET_FAILED", result.error, undefined, meta()), { status: 400, headers: headers() });
    }

    return NextResponse.json(apiSuccess({ success: true }, meta()), { headers: headers() });
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: headers() });
  }
}
