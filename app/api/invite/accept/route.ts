/**
 * POST /api/invite/accept — accept an invite, activate the user account.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { acceptInvite } from "@/lib/services/invite.service";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { validatePassword } from "@/lib/password-policy";

const bodySchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(120),
  password: z.string(),
});

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });
  const ctx = auditContext(request);

  try {
    const rateLimit = await checkTieredRateLimit(getClientIdentifier(request), "anonymous", "/api/invite/accept");
    if (!rateLimit.allowed) {
      return NextResponse.json(apiError("RATE_LIMIT", "Too many attempts.", undefined, meta()), { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimit) } });
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
      const msg = parsed.error.flatten().fieldErrors.token?.[0] ?? parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid request";
      return NextResponse.json(apiError("VALIDATION_ERROR", msg, undefined, meta()), { status: 400, headers: headers() });
    }

    const { token, name, password } = parsed.data;

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json(apiError("VALIDATION_ERROR", pwCheck.errors[0] ?? "Invalid password", undefined, meta()), { status: 400, headers: headers() });
    }

    // Set password in ERPNext before activating user
    const erpUrl = process.env.ERPNEXT_URL ?? "http://localhost:8080";
    const erpApiKey = process.env.ERPNEXT_API_KEY ?? "";
    const erpApiSecret = process.env.ERPNEXT_API_SECRET ?? "";
    const { validateInviteToken } = await import("@/lib/services/invite.service");
    const inviteCheck = await validateInviteToken(token);
    if (!inviteCheck.ok) {
      return NextResponse.json(apiError("INVALID_TOKEN", inviteCheck.error, undefined, meta()), { status: 400, headers: headers() });
    }

    const erpRes = await fetch(`${erpUrl}/api/method/frappe.core.doctype.user.user.update_password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(erpApiKey && erpApiSecret
          ? { Authorization: `token ${erpApiKey}:${erpApiSecret}` }
          : {}),
      },
      body: JSON.stringify({ new_password: password, logout_all_sessions: 1, user: inviteCheck.data.email }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);

    if (!erpRes?.ok) {
      return NextResponse.json(apiError("ERP_ERROR", "Failed to set password. Please try again.", undefined, meta()), { status: 502, headers: headers() });
    }

    const result = await acceptInvite({ raw: token, name });
    if (!result.ok) {
      return NextResponse.json(apiError("INVITE_FAILED", result.error, undefined, meta()), { status: 400, headers: headers() });
    }

    void logAudit({
      accountId: result.data.accountId,
      userId: result.data.userId,
      action: "team.invite.accepted",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      severity: "info",
      outcome: "success",
    });

    return NextResponse.json(apiSuccess({ success: true }, meta()), { headers: headers() });
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: headers() });
  }
}
