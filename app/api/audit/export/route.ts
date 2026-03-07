/**
 * GET /api/audit/export?from=2026-01-01&to=2026-03-01&format=csv|json
 *
 * Streams audit logs for the authenticated account within the requested date range.
 * Streams the response so large exports don't buffer everything in memory.
 *
 * - Requires admin:* permission
 * - Rate limited: 5 exports per hour per account
 * - The export action itself is recorded in the audit trail
 */
import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api/middleware";
import { prisma } from "@/lib/data/prisma";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { apiMeta, getRequestId } from "@/types/api";
import * as Sentry from "@sentry/nextjs";

const BATCH_SIZE = 500; // rows per DB query to keep memory footprint low

// CSV header row matching the spec
const CSV_HEADER = "timestamp,action,userId,ipAddress,severity,outcome,resource,resourceId,metadata\n";

function rowToCsv(row: {
  timestamp: Date;
  action: string;
  userId: string | null;
  ipAddress: string | null;
  severity: string;
  outcome: string;
  resource: string | null;
  resourceId: string | null;
  metadata: unknown;
}): string {
  const esc = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    // Wrap in double quotes and escape existing quotes per RFC 4180
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [
    esc(row.timestamp.toISOString()),
    esc(row.action),
    esc(row.userId),
    esc(row.ipAddress),
    esc(row.severity),
    esc(row.outcome),
    esc(row.resource),
    esc(row.resourceId),
    esc(row.metadata ? JSON.stringify(row.metadata) : ""),
  ].join(",") + "\n";
}

export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const ctx = auditContext(request);

  // Inline error response helper (can't use apiError for streaming responses)
  const errorResponse = (code: string, message: string, status: number) =>
    NextResponse.json(
      { error: { code, message }, meta: apiMeta({ request_id: requestId }) },
      { status, headers: securityHeaders() }
    );

  try {
    const permCheck = await withPermission(request, "admin:*");
    if (!permCheck.ok) return permCheck.response;
    const { session } = permCheck;

    const rateLimit = await checkTieredRateLimit(session.accountId, "authenticated", "/api/audit/export");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMIT", message: "Audit export rate limit: 5 per hour. Try again later." }, meta: apiMeta({ request_id: requestId }) },
        { status: 429, headers: { ...securityHeaders(), ...rateLimitHeaders(rateLimit) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam   = searchParams.get("to");
    const format    = searchParams.get("format") === "json" ? "json" : "csv";

    const fromDate = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate   = toParam   ? new Date(toParam)   : new Date();

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return errorResponse("BAD_REQUEST", "Invalid date format. Use ISO 8601 (e.g. 2026-01-01).", 400);
    }
    if (fromDate > toDate) {
      return errorResponse("BAD_REQUEST", "'from' must be before 'to'.", 400);
    }

    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr   = toDate.toISOString().slice(0, 10);
    const filename = `audit-${fromStr}-${toStr}.${format}`;

    // Log the export action before streaming begins
    void logAudit({
      accountId: session.accountId,
      userId: session.userId,
      action: "audit.export.started",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      severity: "info",
      outcome: "success",
      metadata: { format, from: fromStr, to: toStr },
    });

    // Stream the response using ReadableStream to avoid buffering all rows in memory
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let skip = 0;
          let firstBatch = true;

          if (format === "csv") {
            controller.enqueue(encoder.encode(CSV_HEADER));
          } else {
            controller.enqueue(encoder.encode("[\n"));
          }

          while (true) {
            const rows = await prisma.auditLog.findMany({
              where: {
                accountId: session.accountId,
                timestamp: { gte: fromDate, lte: toDate },
              },
              orderBy: { timestamp: "asc" },
              skip,
              take: BATCH_SIZE,
              select: {
                timestamp: true,
                action: true,
                userId: true,
                ipAddress: true,
                severity: true,
                outcome: true,
                resource: true,
                resourceId: true,
                metadata: true,
              },
            });

            if (rows.length === 0) break;

            for (const row of rows) {
              if (format === "csv") {
                controller.enqueue(encoder.encode(rowToCsv(row)));
              } else {
                const prefix = firstBatch ? "  " : ",\n  ";
                controller.enqueue(encoder.encode(prefix + JSON.stringify(row)));
                firstBatch = false;
              }
            }

            skip += rows.length;
            if (rows.length < BATCH_SIZE) break;
          }

          if (format === "json") {
            controller.enqueue(encoder.encode("\n]\n"));
          }
        } catch (e) {
          Sentry.captureException(e);
          // Can't send HTTP status at this point (headers already sent), so just close
        } finally {
          controller.close();
        }
      },
    });

    const contentType = format === "csv" ? "text/csv" : "application/json";
    return new NextResponse(stream, {
      headers: {
        ...securityHeaders(),
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Response-Time": `${Date.now() - start}ms`,
        "Cache-Control": "private, no-store",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return errorResponse("SERVER_ERROR", "An unexpected error occurred", 500);
  }
}
