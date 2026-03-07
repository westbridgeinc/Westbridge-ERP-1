import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { apiSuccess, apiError, apiMeta, getRequestId } from "@/types/api";
import { COOKIE } from "@/lib/constants";
import { securityHeaders } from "@/lib/security-headers";
import { prisma } from "@/lib/data/prisma";

/**
 * GET /api/auth/validate — validate session cookie and return userId + accountId.
 * Returns 401 if missing or invalid. Used by dashboard or API consumers to verify session.
 */
export async function GET(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const meta = () => apiMeta({ request_id: requestId });
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });
  const ctx = auditContext(request);
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      apiError("UNAUTHORIZED", "Missing session", undefined, meta()),
      { status: 401, headers: headers() }
    );
  }
  const result = await validateSession(token, request);
  if (!result.ok) {
    const systemAccountId = process.env.SYSTEM_ACCOUNT_ID;
    if (systemAccountId) {
      void logAudit({
        accountId: systemAccountId,
        action: "auth.session.invalid",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "warn",
        outcome: "failure",
      });
    }
    return NextResponse.json(
      apiError("UNAUTHORIZED", result.error, undefined, meta()),
      { status: 401, headers: headers() }
    );
  }
  // Fetch name + email so the sidebar footer can show the real user
  const user = await prisma.user.findUnique({
    where: { id: result.data.userId },
    select: { name: true, email: true },
  }).catch(() => null);

  return NextResponse.json(
    apiSuccess(
      {
        userId: result.data.userId,
        accountId: result.data.accountId,
        role: result.data.role,
        email: user?.email ?? "",
        name: user?.name ?? "",
      },
      meta()
    ),
    { headers: headers() }
  );
}
