/**
 * POST /api/invite — owner/admin creates an invite for a new team member.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createInvite } from "@/lib/services/invite.service";
import { withPermission } from "@/lib/api/middleware";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { prisma } from "@/lib/data/prisma";

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });
  const ctx = auditContext(request);

  try {
    const permCheck = await withPermission(request, "users:invite");
    if (!permCheck.ok) return permCheck.response;
    const { session: sessionResult } = permCheck;

    const rateLimit = await checkTieredRateLimit(getClientIdentifier(request), "authenticated", "/api/invite");
    if (!rateLimit.allowed) {
      return NextResponse.json(apiError("RATE_LIMIT", "Too many invite attempts.", undefined, meta()), { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimit) } });
    }

    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get("x-csrf-token") ?? request.headers.get("X-CSRF-Token");
    if (!validateCsrf(csrfHeader, csrfCookie)) {
      return NextResponse.json(apiError("FORBIDDEN", "Invalid or missing CSRF token.", undefined, meta()), { status: 403, headers: headers() });
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json(apiError("INVALID_JSON", "Invalid request body", undefined, meta()), { status: 400, headers: headers() });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid request", undefined, meta()), { status: 400, headers: headers() });
    }

    const { email, role } = parsed.data;
    const { accountId, userId } = sessionResult;

    // Get inviter's name and company name
    const [inviter, account] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.account.findUnique({ where: { id: accountId } }),
    ]);

    const result = await createInvite({
      accountId,
      email,
      role,
      inviterName: inviter?.name ?? inviter?.email ?? "Someone",
      companyName: account?.companyName ?? "your team",
      baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    });

    if (!result.ok) {
      return NextResponse.json(apiError("INVITE_FAILED", result.error, undefined, meta()), { status: 400, headers: headers() });
    }

    void logAudit({
      accountId,
      userId,
      action: "team.invite.sent",
      metadata: { email, role },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      severity: "info",
      outcome: "success",
    });

    return NextResponse.json(apiSuccess({ sent: true }, meta()), { headers: headers() });
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: headers() });
  }
}

/**
 * GET /api/invite?token=... — validate an invite token (called by the accept page).
 */
export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const getRateLimit = await checkTieredRateLimit(getClientIdentifier(request), "anonymous", "/api/invite:get");
    if (!getRateLimit.allowed) {
      return NextResponse.json(
        apiError("RATE_LIMIT", "Too many requests. Try again shortly.", undefined, meta()),
        { status: 429, headers: { ...headers(), ...rateLimitHeaders(getRateLimit) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("token");
    if (!raw) {
      return NextResponse.json(apiError("BAD_REQUEST", "token required", undefined, meta()), { status: 400, headers: headers() });
    }

    const { validateInviteToken } = await import("@/lib/services/invite.service");
    const result = await validateInviteToken(raw);
    if (!result.ok) {
      return NextResponse.json(apiError("INVALID_TOKEN", result.error, undefined, meta()), { status: 400, headers: headers() });
    }

    const account = await prisma.account.findUnique({ where: { id: result.data.accountId } });
    return NextResponse.json(
      apiSuccess({ email: result.data.email, role: result.data.role, companyName: account?.companyName ?? "" }, meta()),
      { headers: headers() }
    );
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: headers() });
  }
}
