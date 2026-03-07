/**
 * DELETE /api/account/delete
 * GDPR right-to-deletion. Owner only.
 * Anonymizes user data and marks account deleted; does not hard-delete (preserves referential integrity).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { prisma } from "@/lib/data/prisma";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { COOKIE } from "@/lib/constants";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get("x-csrf-token") ?? request.headers.get("X-CSRF-Token");
    if (!validateCsrf(csrfHeader, csrfCookie)) {
      return NextResponse.json(
        apiError("FORBIDDEN", "Invalid CSRF token", undefined, meta()),
        { status: 403, headers: hdrs() }
      );
    }

    const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
    if (!token) {
      return NextResponse.json(apiError("UNAUTHORIZED", "Not authenticated", undefined, meta()), { status: 401, headers: hdrs() });
    }
    const sessionResult = await validateSession(token, request);
    if (!sessionResult.ok) {
      return NextResponse.json(apiError("UNAUTHORIZED", sessionResult.error, undefined, meta()), { status: 401, headers: hdrs() });
    }
    const session = sessionResult.data;

    if (session.role !== "owner") {
      return NextResponse.json(
        apiError("FORBIDDEN", "Only the account owner can delete the account", undefined, meta()),
        { status: 403, headers: hdrs() }
      );
    }

    const rateLimit = await checkTieredRateLimit(session.userId, "authenticated", "/api/account/delete");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        apiError("RATE_LIMIT", "Too many attempts. Please wait before trying again.", undefined, meta()),
        { status: 429, headers: { ...hdrs(), ...rateLimitHeaders(rateLimit) } }
      );
    }

    const ctx = auditContext(request);

    await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: { accountId: session.accountId },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      for (const u of users) {
        await tx.user.update({
          where: { id: u.id },
          data: {
            name: "Deleted User",
            email: `deleted-${u.id}@deleted.invalid`,
            status: "deleted",
          },
        });
      }

      await tx.session.deleteMany({ where: { userId: { in: userIds } } });
      await tx.inviteToken.deleteMany({ where: { accountId: session.accountId } });
      await tx.account.update({
        where: { id: session.accountId },
        data: { status: "deleted" },
      });
    });

    await logAudit({
      accountId: session.accountId,
      userId: session.userId,
      action: "account.deleted",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      severity: "info",
      outcome: "success",
    });

    return NextResponse.json(apiSuccess({ message: "Account deleted" }, meta()), { headers: hdrs() });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      apiError("INTERNAL", "An unexpected error occurred", undefined, meta()),
      { status: 500, headers: hdrs() }
    );
  }
}
