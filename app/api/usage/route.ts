/**
 * GET /api/usage — current billing period usage for the authenticated account.
 */
import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api/middleware";
import { meter, estimateAiCost } from "@/lib/metering";
import { prisma } from "@/lib/data/prisma";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import * as Sentry from "@sentry/nextjs";

// User limits by plan — these mirror the plan definitions in lib/modules.ts
const PLAN_USER_LIMITS: Record<string, number | null> = {
  Starter:      5,
  Growth:       25,
  Business:     null, // unlimited
};

export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  try {
    const permCheck = await withPermission(request, "billing:read");
    if (!permCheck.ok) return permCheck.response;
    const { session } = permCheck;

    const rateLimit = await checkTieredRateLimit(getClientIdentifier(request), "authenticated", "/api/usage");
    if (!rateLimit.allowed) {
      return NextResponse.json(apiError("RATE_LIMIT", "Too many requests.", undefined, meta()), { status: 429, headers: { ...hdrs(), ...rateLimitHeaders(rateLimit) } });
    }

    const [usage, account] = await Promise.all([
      meter.get(session.accountId),
      prisma.account.findUnique({
        where: { id: session.accountId },
        select: { plan: true, users: { select: { id: true } } },
      }),
    ]);

    const plan = account?.plan ?? "Starter";
    const userLimit = PLAN_USER_LIMITS[plan] ?? null;
    const aiCostUsd = estimateAiCost(usage.ai_tokens_input, usage.ai_tokens_output);

    return NextResponse.json(
      apiSuccess({
        period: usage.period,
        plan,
        usage: {
          api_calls:       { count: usage.api_calls, limit: null },
          erp_docs_created: { count: usage.erp_docs_created, limit: null },
          active_users:    { count: usage.active_users_count, limit: userLimit },
          ai_tokens:       {
            input: usage.ai_tokens_input,
            output: usage.ai_tokens_output,
            cost_usd: Math.round(aiCostUsd * 100) / 100,
          },
        },
      }, meta()),
      { headers: hdrs() }
    );
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(apiError("SERVER_ERROR", "An unexpected error occurred", undefined, meta()), { status: 500, headers: hdrs() });
  }
}
