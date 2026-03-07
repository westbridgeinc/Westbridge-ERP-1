import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiSuccess, apiError, getRequestId } from "@/types/api";
import { validateCsrf } from "@/lib/csrf";
import { revokeSession, validateSession } from "@/lib/services/session.service";
import { logAudit, auditContext } from "@/lib/services/audit.service";
import { COOKIE } from "@/lib/constants";
import { securityHeaders } from "@/lib/security-headers";

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = getRequestId(request);
  const headers = () => ({ ...securityHeaders(), "X-Response-Time": `${Date.now() - start}ms` });
  const headerToken = request.headers.get("X-CSRF-Token");
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE.CSRF_NAME)?.value ?? null;
  const csrfOk = validateCsrf(headerToken, cookieToken);
  if (!csrfOk) {
    return NextResponse.json(
      apiError("CSRF_INVALID", "Invalid or missing CSRF token", undefined, { request_id: requestId }),
      { status: 403, headers: headers() }
    );
  }

  const ctx = auditContext(request);
  const sid = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  if (sid) {
    const sessionResult = await validateSession(sid, request);
    if (sessionResult.ok) {
      void logAudit({
        accountId: sessionResult.data.accountId,
        userId: sessionResult.data.userId,
        action: "auth.logout",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        severity: "info",
        outcome: "success",
      });
    }
    await revokeSession(sid);
  }

  const response = NextResponse.json(
    apiSuccess({ loggedOut: true }, { request_id: requestId }),
    { headers: headers() }
  );
  response.cookies.set(COOKIE.SESSION_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
  response.cookies.set(COOKIE.CSRF_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
