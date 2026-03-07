/**
 * GET  /api/admin/flags — list all feature flags
 * PUT  /api/admin/flags — update a feature flag (admin only)
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllFlags, setFlag } from "@/lib/feature-flags";
import { validateSession } from "@/lib/services/session.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { COOKIE } from "@/lib/constants";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const flagRuleSchema = z.object({
  condition: z.enum(["user_id", "account_id", "email_domain", "percentage", "environment"]),
  operator: z.enum(["equals", "contains", "in", "percentage_rollout"]),
  value: z.unknown(),
  flagValue: z.union([z.boolean(), z.string(), z.number()]),
});

const flagSchema = z.object({
  key: z.string().min(1).max(100),
  defaultValue: z.union([z.boolean(), z.string(), z.number()]),
  description: z.string().max(500),
  rules: z.array(flagRuleSchema),
});

export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
    const sessionResult = token ? await validateSession(token, request) : null;
    if (!sessionResult?.ok) {
      return NextResponse.json(apiError("UNAUTHORIZED", "Authentication required", undefined, meta()), { status: 401, headers: hdrs() });
    }
    const session = sessionResult.data;
    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json(apiError("FORBIDDEN", "Admin access required", undefined, meta()), { status: 403, headers: hdrs() });
    }

    const flags = await getAllFlags();
    return NextResponse.json(apiSuccess(flags, meta()), { headers: hdrs() });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: hdrs() });
  }
}

export async function PUT(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
    const sessionResult = token ? await validateSession(token, request) : null;
    if (!sessionResult?.ok) {
      return NextResponse.json(apiError("UNAUTHORIZED", "Authentication required", undefined, meta()), { status: 401, headers: hdrs() });
    }
    const session = sessionResult.data;
    if (session.role !== "owner") {
      return NextResponse.json(apiError("FORBIDDEN", "Owner access required to modify flags", undefined, meta()), { status: 403, headers: hdrs() });
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json(apiError("INVALID_JSON", "Invalid request body", undefined, meta()), { status: 400, headers: hdrs() });
    }

    const parsed = flagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", parsed.error.flatten().formErrors[0] ?? "Invalid flag", undefined, meta()), { status: 400, headers: hdrs() });
    }

    await setFlag(parsed.data);

    return NextResponse.json(apiSuccess({ updated: true }, meta()), { headers: hdrs() });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: hdrs() });
  }
}
