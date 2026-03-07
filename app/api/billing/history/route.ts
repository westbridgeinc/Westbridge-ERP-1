/**
 * GET /api/billing/history
 * Returns the account's billing/payment history from the database.
 *
 * TODO: once we integrate a payment provider dashboard (Stripe, 2Checkout),
 *       pull the full invoice list from there. For now we read the `Account`
 *       record to confirm the plan and return an empty history if no payments
 *       are recorded in our DB — which is honest rather than showing fake data.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { prisma } from "@/lib/data/prisma";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const hdrs = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  if (!token) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Not authenticated", undefined, meta()), { status: 401, headers: hdrs() });
  }
  const session = await validateSession(token, request);
  if (!session.ok) {
    return NextResponse.json(apiError("UNAUTHORIZED", session.error, undefined, meta()), { status: 401, headers: hdrs() });
  }

  const account = await prisma.account.findUnique({
    where: { id: session.data.accountId },
    select: { plan: true, status: true, createdAt: true },
  });

  // We don't yet store individual invoice rows — return empty with account context
  // so the UI can render an accurate EmptyState rather than fake invoices.
  return NextResponse.json(
    apiSuccess(
      {
        items: [],
        plan: account?.plan ?? null,
        status: account?.status ?? null,
        accountCreatedAt: account?.createdAt ?? null,
      },
      meta()
    ),
    { headers: hdrs() }
  );
}
