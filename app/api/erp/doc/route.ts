import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { getDoc, createDoc } from "@/lib/services/erp.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { erpDocCreateBodySchema } from "@/types/schemas/erp";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { securityHeaders } from "@/lib/security-headers";
import { reportSecurityEvent } from "@/lib/security-monitor";
import { checkTieredRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { withPermission } from "@/lib/api/middleware";
import * as Sentry from "@sentry/nextjs";

const MAX_BODY_BYTES = 1_048_576;

/**
 * GET /api/erp/doc?doctype=Sales%20Invoice&name=SINV-001
 */
export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
  const permCheck = await withPermission(request, "invoices:read");
  if (!permCheck.ok) return permCheck.response;
  const { session } = permCheck;
  if (!session.erpnextSid) {
    return NextResponse.json(apiError("UNAUTHORIZED", "ERP session not available. Please log in again.", undefined, meta()), { status: 401, headers: headers() });
  }
  const ctx = auditContext(request);
  const rateLimitGet = await checkTieredRateLimit(getClientIdentifier(request), "authenticated", "/api/erp/doc");
  if (!rateLimitGet.allowed) {
    return NextResponse.json(
      apiError("RATE_LIMIT", "Too many requests. Try again in a minute.", undefined, meta()),
      { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimitGet) } }
    );
  }

  const ALLOWED_DOCTYPES = new Set([
    "Sales Invoice", "Sales Order", "Purchase Invoice", "Purchase Order",
    "Quotation", "Customer", "Supplier", "Item", "Employee",
    "Journal Entry", "Payment Entry", "Stock Entry", "Expense Claim",
    "Leave Application", "Salary Slip", "BOM",
  ]);

  const { searchParams } = new URL(request.url);
  const doctype = searchParams.get("doctype");
  const name = searchParams.get("name");
  if (!doctype || !name) {
    return NextResponse.json(
      apiError("BAD_REQUEST", "doctype and name required", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }
  if (!ALLOWED_DOCTYPES.has(doctype)) {
    return NextResponse.json(
      apiError("BAD_REQUEST", "Invalid or unsupported document type", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const result = await getDoc(doctype, name, session.erpnextSid as string, session.accountId);
  if (!result.ok) {
    const status = result.error === "Not found" ? 404 : 502;
    return NextResponse.json(
      apiError("ERP_ERROR", result.error, undefined, meta()),
      { status, headers: headers() }
    );
  }
  void logAudit({
    accountId: session.accountId,
    userId: session.userId,
    action: "erp.doc.read",
    resource: doctype,
    resourceId: name,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    severity: "info",
    outcome: "success",
  });
  return NextResponse.json(apiSuccess(result.data, meta()), { headers: headers() });
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    const meta2 = () => apiMeta({ request_id: requestId });
    const headers2 = () => ({ ...securityHeaders() });
    return NextResponse.json(
      apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta2()),
      { status: 500, headers: headers2() }
    );
  }
}

/**
 * POST /api/erp/doc — create a new document. Body: { doctype, ...fields }
 */
export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      apiError("PAYLOAD_TOO_LARGE", "Request body exceeds 1MB limit", undefined, meta()),
      { status: 413, headers: headers() }
    );
  }

  const permCheck = await withPermission(request, "invoices:write");
  if (!permCheck.ok) return permCheck.response;
  const { session } = permCheck;
  if (!session.erpnextSid) {
    return NextResponse.json(apiError("UNAUTHORIZED", "ERP session not available. Please log in again.", undefined, meta()), { status: 401, headers: headers() });
  }
  const ctx = auditContext(request);

  const rateLimitPost = await checkTieredRateLimit(getClientIdentifier(request), "authenticated", "/api/erp/doc");
  if (!rateLimitPost.allowed) {
    return NextResponse.json(
      apiError("RATE_LIMIT", "Too many requests. Try again in a minute.", undefined, meta()),
      { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimitPost) } }
    );
  }

  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const csrfHeader = request.headers.get("x-csrf-token") ?? request.headers.get("X-CSRF-Token");
  if (!validateCsrf(csrfHeader, csrfCookie)) {
    void logAudit({
      accountId: session.accountId,
      userId: session.userId,
      action: "erp.doc.create.csrf_failed",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      severity: "warn",
      outcome: "failure",
    });
    reportSecurityEvent({
      type: "csrf_attack",
      userId: session.userId,
      accountId: session.accountId,
      ipAddress: ctx.ipAddress,
      details: "CSRF validation failed on erp.doc.create",
    });
    return NextResponse.json(
      apiError("FORBIDDEN", "Invalid or missing CSRF token.", undefined, meta()),
      { status: 403, headers: headers() }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      apiError("INVALID_JSON", "Invalid JSON", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const parsed = erpDocCreateBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message = (first.doctype as string[])?.[0] ?? "Invalid request";
    return NextResponse.json(
      apiError("VALIDATION_ERROR", message, undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const FORBIDDEN_FIELDS = new Set([
    "docstatus", "owner", "modified_by", "creation", "modified",
    "idx", "parent", "parentfield", "parenttype", "amended_from",
  ]);
  const { doctype, ...rawData } = parsed.data as { doctype: string; [k: string]: unknown };
  const data = Object.fromEntries(
    Object.entries(rawData).filter(([k]) => !FORBIDDEN_FIELDS.has(k))
  );
  const ALLOWED_DOCTYPES_POST = new Set([
    "Sales Invoice", "Sales Order", "Purchase Invoice", "Purchase Order",
    "Quotation", "Customer", "Supplier", "Item", "Employee",
    "Journal Entry", "Payment Entry", "Stock Entry", "Expense Claim",
    "Leave Application", "Salary Slip", "BOM",
  ]);
  if (!ALLOWED_DOCTYPES_POST.has(doctype)) {
    return NextResponse.json(
      apiError("BAD_REQUEST", "Invalid or unsupported document type", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }
  const result = await createDoc(doctype, session.erpnextSid as string, data as Record<string, unknown>, session.accountId);
  if (!result.ok) {
    return NextResponse.json(
      apiError("ERP_ERROR", result.error, undefined, meta()),
      { status: 502, headers: headers() }
    );
  }
  const created = result.data as { name?: string };
  void logAudit({
    accountId: session.accountId,
    userId: session.userId,
    action: "erp.doc.create",
    resource: doctype,
    resourceId: created?.name ?? undefined,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    severity: "info",
    outcome: "success",
  });
  // Meter billable doc creation — fire-and-forget
  const { meter } = await import("@/lib/metering");
  meter.increment(session.accountId, "erp_docs_created").catch(() => {});
  return NextResponse.json(apiSuccess(result.data, meta()), { headers: headers() });
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    return NextResponse.json(
      apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()),
      { status: 500, headers: headers() }
    );
  }
}
