import { NextResponse } from "next/server";
import { list } from "@/lib/services/erp.service";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { parseAndValidateFilters } from "@/lib/validation/erp-filters";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, checkErpAccountRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { withPermission } from "@/lib/api/middleware";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/data/prisma";

/**
 * GET /api/erp/list?doctype=Sales%20Invoice
 * Returns list of records from ERPNext. Requires auth cookie.
 */
export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms`, "Cache-Control": "private, no-cache, no-store, must-revalidate", "Vary": "Accept-Encoding, Accept" });

  try {
  const permCheck = await withPermission(request, "invoices:read");
  if (!permCheck.ok) return permCheck.response;
  const { session } = permCheck;
  const rateLimit = await checkTieredRateLimit(getClientIdentifier(request), "authenticated", "/api/erp/list");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError("RATE_LIMIT", "Too many requests. Try again in a minute.", undefined, meta()),
      { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimit) } }
    );
  }
  const erpAccountLimit = await checkErpAccountRateLimit(session.accountId);
  if (!erpAccountLimit.allowed) {
    return NextResponse.json(
      apiError("RATE_LIMIT", "Too many ERP requests for this account. Try again in a minute.", undefined, meta()),
      { status: 429, headers: { ...headers(), ...rateLimitHeaders(erpAccountLimit) } }
    );
  }
  const ctx = auditContext(request);
  const { accountId, erpnextSid } = session;
  if (!erpnextSid) {
    return NextResponse.json(
      apiError("UNAUTHORIZED", "ERP session not available. Please log in again.", undefined, meta()),
      { status: 401, headers: headers() }
    );
  }
  const sid = erpnextSid;

  const ALLOWED_DOCTYPES = new Set([
    "Sales Invoice", "Sales Order", "Purchase Invoice", "Purchase Order",
    "Quotation", "Customer", "Supplier", "Item", "Employee",
    "Journal Entry", "Payment Entry", "Stock Entry", "Expense Claim",
    "Leave Application", "Salary Slip", "BOM",
  ]);

  const { searchParams } = new URL(request.url);
  const doctype = searchParams.get("doctype");
  if (!doctype) {
    return NextResponse.json(
      apiError("BAD_REQUEST", "doctype required", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }
  if (!ALLOWED_DOCTYPES.has(doctype)) {
    return NextResponse.json(
      apiError("BAD_REQUEST", "Invalid or unsupported document type", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const ORDER_BY_ALLOWLIST = new Set([
    "creation desc", "creation asc", "modified desc", "modified asc",
    "name desc", "name asc", "posting_date desc", "posting_date asc",
    "grand_total desc", "grand_total asc", "status desc", "status asc",
  ]);
  const rawOrderBy = searchParams.get("order_by") ?? "creation desc";
  const orderBy = ORDER_BY_ALLOWLIST.has(rawOrderBy.toLowerCase()) ? rawOrderBy : "creation desc";
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const rawPage = searchParams.get("page") ?? "0";
  const pageNum = parseInt(rawPage, 10);
  if (Number.isNaN(pageNum) || pageNum < 0 || !Number.isInteger(pageNum)) {
    return NextResponse.json(
      apiError("BAD_REQUEST", "page must be a non-negative integer", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }
  const page = pageNum;
  const limit_start = page * pageSize;
  const fields = searchParams.get("fields");
  const filtersParam = searchParams.get("filters");

  const filtersResult = parseAndValidateFilters(filtersParam);
  if (!filtersResult.ok) {
    return NextResponse.json(
      apiError("BAD_REQUEST", filtersResult.error, undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const params: Record<string, string> = {
    limit_page_length: String(pageSize),
    limit_start: String(limit_start),
    order_by: orderBy,
  };
  if (fields) params.fields = JSON.stringify(fields.split(",").map((f) => f.trim()));
  if (filtersResult.filters !== "[]") params.filters = filtersResult.filters;

  const account = await prisma.account.findUnique({ where: { id: accountId }, select: { erpnextCompany: true } }).catch(() => null);
  const result = await list(doctype, sid, params, accountId ?? undefined, account?.erpnextCompany);
  if (!result.ok) {
    const status = result.error === "doctype required" ? 400 : 502;
    return NextResponse.json(
      apiError("ERP_ERROR", result.error, undefined, meta()),
      { status, headers: headers() }
    );
  }
  void logAudit({
    accountId: session.accountId,
    userId: session.userId,
    action: "erp.list.read",
    resource: doctype,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    severity: "info",
    outcome: "success",
  });
  const hasMore = Array.isArray(result.data) && result.data.length === pageSize;
  return NextResponse.json(
    apiSuccess(result.data, { ...meta(), page, pageSize, hasMore }),
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
