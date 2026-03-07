/**
 * GET /api/team
 * Returns all users belonging to the current account.
 * Requires a valid session. Results are scoped to accountId (row-level security).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { prisma } from "@/lib/data/prisma";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { checkTieredRateLimit, getClientIdentifier, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
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

  const rateLimit = await checkTieredRateLimit(getClientIdentifier(request), "authenticated", "/api/team");
  if (!rateLimit.allowed) {
    return NextResponse.json(apiError("RATE_LIMIT", "Too many requests", undefined, meta()), { status: 429, headers: { ...hdrs(), ...rateLimitHeaders(rateLimit) } });
  }

  const users = await prisma.user.findMany({
    where: { accountId: session.data.accountId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const currentUserId = session.data.userId;

  const members = users.map((u) => ({
    id: u.id,
    name: u.name ?? u.email.split("@")[0],
    email: u.email,
    role: u.role,
    status: u.status,
    lastActive: u.createdAt ? formatRelative(u.createdAt) : "Never",
    isYou: u.id === currentUserId,
  }));

  return NextResponse.json(apiSuccess({ members }, meta()), { headers: hdrs() });
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
