import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { COOKIE } from "@/lib/constants";

const validateSessionMock = vi.fn();
vi.mock("@/lib/services/session.service", () => ({
  validateSession: (token: string, _req?: Request) => validateSessionMock(token),
}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (name === COOKIE.SESSION_NAME ? { value: "session-token" } : undefined),
    }),
}));
vi.mock("@/lib/services/erp.service", () => ({ getDoc: vi.fn(), createDoc: vi.fn() }));
vi.mock("@/lib/services/audit.service", () => ({ logAudit: vi.fn(), auditContext: () => ({ ipAddress: "127.0.0.1", userAgent: "test" }) }));
vi.mock("@/lib/security-monitor", () => ({ reportSecurityEvent: vi.fn() }));
vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true), CSRF_COOKIE_NAME: "westbridge_csrf" }));

describe("POST /api/erp/doc", () => {
  beforeEach(() => {
    validateSessionMock.mockReset();
  });

  it("returns 403 when session role is member (create requires owner or admin)", async () => {
    validateSessionMock.mockResolvedValue({
      ok: true,
      data: {
        userId: "u1",
        accountId: "a1",
        role: "member",
        erpnextSid: "erpsid",
      },
    });
    const request = new Request("http://localhost/api/erp/doc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": "x" },
      body: JSON.stringify({ doctype: "Sales Invoice" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error?.code).toBe("FORBIDDEN");
    expect(json.error?.message).toBe("Insufficient permissions");
  });

  it("returns 401 when validateSession fails", async () => {
    validateSessionMock.mockResolvedValue({ ok: false, error: "Invalid session" });
    const request = new Request("http://localhost/api/erp/doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctype: "Sales Invoice" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
