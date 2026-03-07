/**
 * Composable API middleware pipeline.
 * Eliminates boilerplate from route handlers and standardises cross-cutting concerns.
 *
 * @example
 * export const POST = createPipeline([
 *   withRequestId,
 *   withTracing,
 *   withRateLimit({ tier: 'authenticated', cost: 1 }),
 *   withCsrf,
 *   withAuth,
 *   withAuditLog({ action: 'invoice.create' }),
 *   withResponseTime,
 * ], handler);
 */
import { NextResponse } from "next/server";
import { extractTraceId, getCurrentTraceContext } from "@/lib/telemetry";
import { securityHeaders } from "@/lib/security-headers";
import { apiError, apiMeta, getRequestId } from "@/types/api";
import { checkTieredRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { validateSession } from "@/lib/services/session.service";
import { validateCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/constants";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";
import type { RateLimitTier } from "@/lib/api/rate-limit-tiers";

// ─── Pipeline context ─────────────────────────────────────────────────────────

export interface SessionData {
  userId: string;
  accountId: string;
  role: string;
  erpnextSid?: string | null;
}

export interface PipelineContext {
  request: Request;
  requestId: string;
  traceId: string | null;
  startTime: number;
  session?: SessionData;
  rateLimitHeaders?: Record<string, string>;
}

type MiddlewareFn = (
  ctx: PipelineContext,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

type RouteHandler = (ctx: PipelineContext) => Promise<NextResponse>;

// ─── Built-in middleware ──────────────────────────────────────────────────────

export const withRequestId: MiddlewareFn = async (ctx, next) => next();

export const withTracing: MiddlewareFn = async (ctx, next) => {
  ctx.traceId = extractTraceId(ctx.request) ?? getCurrentTraceContext().traceId;
  return next();
};

export const withResponseTime: MiddlewareFn = async (ctx, next) => {
  const res = await next();
  res.headers.set("X-Response-Time", `${Date.now() - ctx.startTime}ms`);
  return res;
};

export function withRateLimit(options: {
  tier: RateLimitTier;
  cost?: number;
}): MiddlewareFn {
  return async (ctx, next) => {
    const ip =
      ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      ctx.request.headers.get("x-real-ip") ??
      "anon";
    const identifier = ctx.session ? `${ctx.session.userId}:${ip}` : ip;
    const url = new URL(ctx.request.url);
    const result = await checkTieredRateLimit(identifier, options.tier, url.pathname, options.cost ?? 1);
    ctx.rateLimitHeaders = rateLimitHeaders(result);
    if (!result.allowed) {
      const meta = apiMeta({ request_id: ctx.requestId });
      return NextResponse.json(
        apiError("RATE_LIMIT", "Too many requests.", undefined, meta),
        { status: 429, headers: { ...securityHeaders(), ...ctx.rateLimitHeaders } }
      );
    }
    return next();
  };
}

export const withCsrf: MiddlewareFn = async (ctx, next) => {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const csrfHeader =
    ctx.request.headers.get("x-csrf-token") ??
    ctx.request.headers.get("X-CSRF-Token");
  if (!validateCsrf(csrfHeader, csrfCookie)) {
    const meta = apiMeta({ request_id: ctx.requestId });
    return NextResponse.json(
      apiError("FORBIDDEN", "Invalid or missing CSRF token.", undefined, meta),
      { status: 403, headers: securityHeaders() }
    );
  }
  return next();
};

export const withAuth: MiddlewareFn = async (ctx, next) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  const result = token ? await validateSession(token, ctx.request) : null;
  if (!result?.ok) {
    const meta = apiMeta({ request_id: ctx.requestId });
    return NextResponse.json(
      apiError("UNAUTHORIZED", "Authentication required.", undefined, meta),
      { status: 401, headers: securityHeaders() }
    );
  }
  ctx.session = result.data;
  return next();
};

export function withPermission(permission: import("@/lib/rbac").Permission): MiddlewareFn {
  return async (ctx, next) => {
    // Permissions are checked against the RBAC system (lib/rbac.ts)
    const { hasPermission } = await import("@/lib/rbac");
    if (!ctx.session || !hasPermission(ctx.session.role, permission)) {
      const meta = apiMeta({ request_id: ctx.requestId });
      return NextResponse.json(
        apiError("FORBIDDEN", "Insufficient permissions.", undefined, meta),
        { status: 403, headers: securityHeaders() }
      );
    }
    return next();
  };
}

export function withAuditLog(options: { action: string }): MiddlewareFn {
  return async (ctx, next) => {
    const res = await next();
    if (ctx.session && res.status < 400) {
      const { logAudit } = await import("@/lib/services/audit.service");
      void logAudit({
        accountId: ctx.session.accountId,
        userId: ctx.session.userId,
        action: options.action,
        ipAddress:
          ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: ctx.request.headers.get("user-agent") ?? null,
        severity: "info",
        outcome: "success",
      });
    }
    return res;
  };
}

// ─── Pipeline factory ─────────────────────────────────────────────────────────

// TODO: existing routes (erp/list, erp/doc, auth/*) still use manual middleware
//       calls rather than createPipeline(). Migrate them incrementally — they work
//       fine as-is, it's just boilerplate. Track in TD-06.

/**
 * Create a route handler from an ordered list of middleware.
 *
 * @example
 * export const POST = createPipeline(
 *   [withRequestId, withTracing, withRateLimit({ tier: 'authenticated' }), withCsrf, withAuth, withResponseTime],
 *   async (ctx) => { ... return NextResponse.json(...) }
 * );
 */
export function createPipeline(
  middlewares: MiddlewareFn[],
  handler: RouteHandler
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    const ctx: PipelineContext = {
      request,
      requestId: getRequestId(request),
      traceId: null,
      startTime: Date.now(),
    };

    // Apply standard security headers to all responses
    const wrap = (res: NextResponse): NextResponse => {
      for (const [k, v] of Object.entries(securityHeaders())) {
        res.headers.set(k, v);
      }
      if (ctx.rateLimitHeaders) {
        for (const [k, v] of Object.entries(ctx.rateLimitHeaders)) {
          res.headers.set(k, v);
        }
      }
      return res;
    };

    // Build composed middleware chain (right to left)
    let index = 0;
    const run = async (): Promise<NextResponse> => {
      if (index < middlewares.length) {
        const mw = middlewares[index++];
        return mw(ctx, run);
      }
      try {
        return await handler(ctx);
      } catch (error) {
        logger.error("Unhandled pipeline error", { error: error instanceof Error ? error.message : String(error), requestId: ctx.requestId });
        Sentry.captureException(error, { extra: { request_id: ctx.requestId } });
        const meta = apiMeta({ request_id: ctx.requestId });
        return NextResponse.json(
          apiError("SERVER_ERROR", "An unexpected error occurred.", undefined, meta),
          { status: 500 }
        );
      }
    };

    return wrap(await run());
  };
}
