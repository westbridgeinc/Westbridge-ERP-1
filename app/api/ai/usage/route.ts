import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { getAiUsage } from "@/lib/ai/limits";
import { getPlan } from "@/lib/modules";
import { securityHeaders } from "@/lib/security-headers";
import { prisma } from "@/lib/data/prisma";
import { COOKIE } from "@/lib/constants";
import type { PlanId } from "@/lib/modules";

export async function GET(req: Request) {
  const hdrs = securityHeaders();

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: hdrs });
  }

  const sessionResult = await validateSession(token, req);
  if (!sessionResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: hdrs });
  }
  const session = sessionResult.data;

  const account = await prisma.account.findUnique({
    where: { id: session.accountId },
    select: { plan: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: hdrs });
  }

  const rawPlan = account.plan.toLowerCase();
  const planId: PlanId =
    rawPlan === "enterprise" ? "enterprise" :
    rawPlan === "business" ? "business" :
    "starter";

  const usage = await getAiUsage(session.accountId);
  const plan = getPlan(planId);
  const { aiQueriesPerMonth, aiTokensPerMonth } = plan.limits;

  return NextResponse.json({
    data: {
      plan: plan.name,
      period: new Date().toISOString().slice(0, 7),
      ai: {
        queries: {
          used: usage.queries,
          limit: aiQueriesPerMonth === -1 ? null : aiQueriesPerMonth,
          unlimited: aiQueriesPerMonth === -1,
          overageRate: plan.overageRates.perExtraAiQuery,
        },
        tokens: {
          used: usage.tokens,
          limit: aiTokensPerMonth === -1 ? null : aiTokensPerMonth,
          unlimited: aiTokensPerMonth === -1,
        },
      },
    },
  }, { headers: hdrs });
}
