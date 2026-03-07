import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkTieredRateLimit, checkEmailRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { createAccount } from "@/lib/services/billing.service";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { signupBodySchema } from "@/types/schemas/signup";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { securityHeaders } from "@/lib/security-headers";
import * as Sentry from "@sentry/nextjs";

const MAX_BODY_BYTES = 1_048_576;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "10minutemail.com",
  "throwaway.email", "yopmail.com", "sharklasers.com", "guerrillamailblock.com",
  "grr.la", "spam4.me", "trashmail.com", "maildrop.cc", "dispostable.com",
  "fakeinbox.com", "spamgourmet.com", "mytemp.email", "temp-mail.org",
  "discard.email", "spamex.com", "trashmail.net",
]);

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

  const ctx = auditContext(request);
  const id = getClientIdentifier(request);
  const rateLimit = await checkTieredRateLimit(id, "anonymous", "/api/signup");
  if (!rateLimit.allowed) {
    const systemAccountId = process.env.SYSTEM_ACCOUNT_ID;
    if (systemAccountId) {
      void logAudit({
        accountId: systemAccountId,
        action: "account.signup.rate_limited",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "warn",
        outcome: "failure",
      });
    }
    return NextResponse.json(
      apiError("RATE_LIMIT", "Too many signup attempts. Try again in a minute.", undefined, meta()),
      { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimit) } }
    );
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
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      apiError("INVALID_JSON", "Invalid request body", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const parsed = signupBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message = first.email?.[0] ?? first.companyName?.[0] ?? first.plan?.[0] ?? "Invalid request";
    return NextResponse.json(
      apiError("VALIDATION_ERROR", message, undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const emailDomain = parsed.data.email.split("@")[1]?.toLowerCase();
  if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Disposable email addresses are not allowed.", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const emailRateLimit = await checkEmailRateLimit(parsed.data.email);
  if (!emailRateLimit.allowed) {
    const systemAccountIdForAudit = process.env.SYSTEM_ACCOUNT_ID;
    if (systemAccountIdForAudit) {
      void logAudit({
        accountId: systemAccountIdForAudit,
        action: "account.signup.rate_limited",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "warn",
        outcome: "failure",
      });
    }
    return NextResponse.json(
      apiError("RATE_LIMIT", "Too many attempts. Try again in a minute.", undefined, meta()),
      { status: 429, headers: { ...headers(), ...rateLimitHeaders(emailRateLimit) } }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const result = await createAccount(parsed.data, baseUrl);

  if (!result.ok) {
    const status =
      result.error === "An account with this email already exists. Please sign in." ? 409
      : result.error === "Email, company name, and plan are required" || result.error === "Invalid plan" ? 400
      : 500;
    const { logger } = await import("@/lib/logger");
    if (status === 500) logger.error("Signup API error", { error: result.error, request_id: requestId });
    const systemAccountId = process.env.SYSTEM_ACCOUNT_ID;
    if (systemAccountId) {
      void logAudit({
        accountId: systemAccountId,
        action: "account.signup.failure",
        metadata: { reason: result.error },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "warn",
        outcome: "failure",
      });
    }
    return NextResponse.json(
      apiError("SIGNUP_FAILED", result.error, undefined, meta()),
      { status, headers: headers() }
    );
  }

  void logAudit({
    accountId: result.data.accountId,
    action: "account.created",
    metadata: { email: parsed.data.email, plan: parsed.data.plan },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    severity: "info",
    outcome: "success",
  });

  return NextResponse.json(apiSuccess(result.data, meta()), { headers: headers() });
  } catch (error) {
    Sentry.captureException(error, { extra: { request_id: requestId } });
    return NextResponse.json(
      apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()),
      { status: 500, headers: headers() }
    );
  }
}
