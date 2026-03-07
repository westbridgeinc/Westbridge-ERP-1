/**
 * Route-level middleware helpers for API routes.
 *
 * Usage:
 *   import { withPermission } from "@/lib/api/middleware";
 *
 *   export async function GET(req: Request) {
 *     const check = await withPermission(req, "invoices:read");
 *     if (!check.ok) return check.response;
 *     const { session } = check;
 *     // ... handler logic ...
 *   }
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { hasPermission, type Permission } from "@/lib/rbac";
import { apiError, apiMeta, getRequestId } from "@/types/api";
import { securityHeaders } from "@/lib/security-headers";
import { COOKIE } from "@/lib/constants";
import { logAudit } from "@/lib/services/audit.service";
import type { SessionRole } from "@/lib/services/session.service";

type SessionData = { userId: string; accountId: string; role: SessionRole; erpnextSid?: string | null };

type PermissionCheckOk = {
  ok: true;
  session: SessionData;
};

type PermissionCheckFail = {
  ok: false;
  response: NextResponse;
};

type PermissionCheck = PermissionCheckOk | PermissionCheckFail;

/**
 * Validates session and checks that the caller holds the required permission.
 * Returns the session on success, or a ready-to-return NextResponse on failure.
 *
 * Permission denials are written to the audit trail so security incidents are
 * traceable.
 */
export async function withPermission(
  request: Request,
  permission: Permission
): Promise<PermissionCheck> {
  const requestId = getRequestId(request);
  const meta = apiMeta({ request_id: requestId });
  const hdrs = { ...securityHeaders() };

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  const sessionResult = token ? await validateSession(token, request) : null;

  if (!sessionResult?.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        apiError("UNAUTHORIZED", "Authentication required", undefined, meta),
        { status: 401, headers: hdrs }
      ),
    };
  }

  const session = sessionResult.data;

  if (!hasPermission(session.role, permission)) {
    // Audit the denial so it's visible in security reviews.
    await logAudit({
      action: "permission.denied",
      userId: session.userId,
      accountId: session.accountId,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      severity: "warn",
      outcome: "failure",
      metadata: {
        required: permission,
        actual_role: session.role,
        path: new URL(request.url).pathname,
      },
    }).catch(() => {});

    return {
      ok: false,
      response: NextResponse.json(
        apiError("FORBIDDEN", "Insufficient permissions", undefined, meta),
        { status: 403, headers: hdrs }
      ),
    };
  }

  return { ok: true, session };
}
