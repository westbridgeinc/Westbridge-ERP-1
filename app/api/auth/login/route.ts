import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkTieredRateLimit, checkEmailRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { login } from "@/lib/services/auth.service";
import { createSession } from "@/lib/services/session.service";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { loginBodySchema } from "@/types/schemas/auth";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { prisma } from "@/lib/data/prisma";
import { COOKIE } from "@/lib/constants";
import { securityHeaders } from "@/lib/security-headers";
import { logRequest } from "@/lib/request-logger";
import * as Sentry from "@sentry/nextjs";
import { reportSecurityEvent } from "@/lib/security-monitor";

const MAX_BODY_BYTES = 1_048_576;

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });
  const log = (status: number) => logRequest(request, { status }, Date.now() - start);
  const ctx = auditContext(request);

  try {
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    log(413);
    return NextResponse.json(
      apiError("PAYLOAD_TOO_LARGE", "Request body exceeds 1MB limit", undefined, meta()),
      { status: 413, headers: headers() }
    );
  }

  const id = getClientIdentifier(request);
  const rateLimit = await checkTieredRateLimit(id, "anonymous", "/api/auth/login");
  if (!rateLimit.allowed) {
    const systemAccountId = process.env.SYSTEM_ACCOUNT_ID;
    if (systemAccountId) {
      void logAudit({
        accountId: systemAccountId,
        action: "auth.login.rate_limited",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "warn",
        outcome: "failure",
      });
    }
    log(429);
    return NextResponse.json(
      apiError("RATE_LIMIT", "Too many attempts. Try again in a minute.", undefined, meta()),
      { status: 429, headers: { ...headers(), ...rateLimitHeaders(rateLimit) } }
    );
  }

  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const csrfHeader = request.headers.get("x-csrf-token") ?? request.headers.get("X-CSRF-Token");
  if (!validateCsrf(csrfHeader, csrfCookie)) {
    log(403);
    return NextResponse.json(
      apiError("FORBIDDEN", "Invalid or missing CSRF token.", undefined, meta()),
      { status: 403, headers: headers() }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    log(400);
    return NextResponse.json(
      apiError("INVALID_JSON", "Invalid request body", undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const parsed = loginBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message = first.email?.[0] ?? first.password?.[0] ?? "Invalid request";
    log(400);
    return NextResponse.json(
      apiError("VALIDATION_ERROR", message, undefined, meta()),
      { status: 400, headers: headers() }
    );
  }

  const { email, password } = parsed.data;
  const emailRateLimit = await checkEmailRateLimit(email);
  if (!emailRateLimit.allowed) {
    const systemAccountId = process.env.SYSTEM_ACCOUNT_ID;
    if (systemAccountId) {
      void logAudit({
        accountId: systemAccountId,
        action: "auth.login.rate_limited",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "warn",
        outcome: "failure",
      });
    }
    log(429);
    return NextResponse.json(
      apiError("RATE_LIMIT", "Too many attempts. Try again in a minute.", undefined, meta()),
      { status: 429, headers: { ...headers(), ...rateLimitHeaders(emailRateLimit) } }
    );
  }

  const account = await prisma.account.findUnique({ where: { email } }).catch(() => null);
  if (!account) {
    log(401);
    return NextResponse.json(
      apiError("AUTH_FAILED", "Invalid email or password.", undefined, meta()),
      { status: 401, headers: headers() }
    );
  }

  // Look up the user record — must already exist (created by admin invite)
  // Exception: the very first user for an account is auto-created as owner
  let user = await prisma.user.findUnique({
    where: { accountId_email: { accountId: account.id, email } },
  });

  if (!user) {
    const existingCount = await prisma.user.count({ where: { accountId: account.id } });
    if (existingCount > 0) {
      // Account already has users — this person was not invited. Deny access.
      void logAudit({
        accountId: account.id,
        action: "auth.login.user_not_invited",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "warn",
        outcome: "failure",
        metadata: { email },
      });
      log(403);
      return NextResponse.json(
        apiError("AUTH_FAILED", "Invalid email or password.", undefined, meta()),
        { status: 401, headers: headers() }
      );
    }
    // First user for this account — create as owner
    user = await prisma.user.create({
      data: {
        accountId: account.id,
        email,
        name: null,
        role: "owner",
        status: "active",
      },
    });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    void logAudit({
      accountId: account.id,
      userId: user.id,
      action: "auth.login.account_locked",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      severity: "warn",
      outcome: "failure",
    });
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    log(423);
    return NextResponse.json(
      apiError("ACCOUNT_LOCKED", `Account temporarily locked. Try again in ${mins} minutes.`, undefined, meta()),
      { status: 423, headers: headers() }
    );
  }

  const loginResult = await login(email, password);

  if (!loginResult.ok) {
    const { logger } = await import("@/lib/logger");
    logger.warn("Login failed", { error: loginResult.error, request_id: requestId });
    const nextAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const lockedUntil = nextAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: nextAttempts,
        lastFailedLogin: new Date(),
        ...(lockedUntil ? { lockedUntil } : {}),
      },
    });
    if (lockedUntil) {
      void logAudit({
        accountId: account.id,
        userId: user.id,
        action: "auth.login.account_lockout",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "critical",
        outcome: "failure",
      });
      reportSecurityEvent({
        type: "brute_force",
        userId: user.id,
        accountId: account.id,
        ipAddress: ctx.ipAddress,
        details: "Account locked after 5 failed login attempts",
      });
    }
    void logAudit({
      accountId: account.id,
      userId: user.id,
      action: "auth.login.failure",
      metadata: { reason: loginResult.error },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      severity: "warn",
      outcome: "failure",
    });
    log(401);
    return NextResponse.json(
      apiError("AUTH_FAILED", "Invalid email or password.", undefined, meta()),
      { status: 401, headers: headers() }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const erpnextSid = loginResult.data;
  const sessionResult = await createSession(user.id, request, erpnextSid);
  if (!sessionResult.ok) {
    log(500);
    return NextResponse.json(
      apiError("SESSION_ERROR", sessionResult.error, undefined, meta()),
      { status: 500, headers: headers() }
    );
  }

  const { token, expiresAt } = sessionResult.data;
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  void logAudit({
    accountId: account.id,
    userId: user.id,
    action: "auth.login.success",
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    severity: "info",
    outcome: "success",
  });

  // Identify user in PostHog so plan + company are attached to all future events
  const { identify } = await import("@/lib/analytics/posthog.server");
  identify(user.id, {
    email: user.email,
    plan: account.plan,
    companyName: account.companyName,
  });

  log(200);
  const response = NextResponse.json(apiSuccess({ success: true }, meta()), { headers: headers() });
  response.cookies.set(COOKIE.SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return response;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        request_id: requestId,
        method: request.method,
        url: request.url,
      },
    });
    log(500);
    return NextResponse.json(
      apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()),
      { status: 500, headers: headers() }
    );
  }
}
