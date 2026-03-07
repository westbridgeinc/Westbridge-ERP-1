import { NextResponse } from "next/server";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { withPermission } from "@/lib/api/middleware";
import { prisma } from "@/lib/data/prisma";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import * as Sentry from "@sentry/nextjs";

const MAX_PER_PAGE = 100;

/**
 * GET /api/audit — paginated audit logs for the current account.
 * Owner only. Query params: page, per_page (max 100), action, severity, from, to (ISO dates).
 */
export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = (pagination?: { page: number; per_page: number; total: number; total_pages: number }) =>
    apiMeta({ request_id: requestId, ...(pagination && { pagination }) });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });
  const ctx = auditContext(request);

  try {
  const permCheck = await withPermission(request, "audit_logs:read");
  if (!permCheck.ok) return permCheck.response;
  const { session: sessionResult } = permCheck;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, parseInt(searchParams.get("per_page") ?? "20", 10) || 20));
  const actionFilter = searchParams.get("action") ?? undefined;
  const severityFilter = searchParams.get("severity") ?? undefined;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const fromDate = fromParam ? new Date(fromParam) : undefined;
  const toDate = toParam ? new Date(toParam) : undefined;

  const where: { accountId: string; action?: string; severity?: string; timestamp?: { gte?: Date; lte?: Date } } = {
    accountId: sessionResult.accountId,
  };
  if (actionFilter) where.action = actionFilter;
  if (severityFilter) where.severity = severityFilter;
  if (fromDate || toDate) {
    where.timestamp = {};
    if (fromDate && !isNaN(fromDate.getTime())) where.timestamp.gte = fromDate;
    if (toDate && !isNaN(toDate.getTime())) where.timestamp.lte = toDate;
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  void logAudit({
    accountId: sessionResult.accountId,
    userId: sessionResult.userId,
    action: "audit.log.accessed",
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    severity: "info",
    outcome: "success",
  });

  const totalPages = Math.ceil(total / perPage);
  return NextResponse.json(
    apiSuccess(
      { logs },
      meta({ page, per_page: perPage, total, total_pages: totalPages })
    ),
    { headers: headers() }
  );
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    return NextResponse.json(
      apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()),
      { status: 500, headers: headers() }
    );
  }
}
