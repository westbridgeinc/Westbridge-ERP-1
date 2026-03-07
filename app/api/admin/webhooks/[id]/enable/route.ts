/**
 * POST /api/admin/webhooks/:id/enable
 * Resets disabledAt and consecutiveFailures so the circuit breaker is cleared.
 * Owner-only — they're acknowledging the endpoint is healthy again.
 */
import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api/middleware";
import { prisma } from "@/lib/data/prisma";
import { logAudit } from "@/lib/services/audit.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import * as Sentry from "@sentry/nextjs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const permCheck = await withPermission(request, "admin:*");
    if (!permCheck.ok) return permCheck.response;
    const { session } = permCheck;

    const { id } = await params;

    // Verify the endpoint belongs to this account
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, accountId: session.accountId },
      select: { id: true },
    });

    if (!endpoint) {
      return NextResponse.json(apiError("NOT_FOUND", "Webhook endpoint not found", undefined, meta()), { status: 404, headers: hdrs() });
    }

    await prisma.webhookEndpoint.update({
      where: { id },
      data: { disabledAt: null, consecutiveFailures: 0, enabled: true },
    });

    void logAudit({
      accountId: session.accountId,
      userId: session.userId,
      action: "webhook.endpoint.re_enabled",
      resourceId: id,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      severity: "info",
      outcome: "success",
    });

    return NextResponse.json(apiSuccess({ enabled: true }, meta()), { headers: hdrs() });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: hdrs() });
  }
}
