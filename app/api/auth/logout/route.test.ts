import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { COOKIE } from "@/lib/constants";
import * as csrf from "@/lib/csrf";

const validateSessionMock = vi.fn();
const revokeSessionMock = vi.fn();
vi.mock("@/lib/services/session.service", () => ({
  validateSession: (t: string, _r?: Request) => validateSessionMock(t),
  revokeSession: (t: string) => revokeSessionMock(t),
}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === COOKIE.SESSION_NAME ? { value: "sid" } : name === COOKIE.CSRF_NAME ? { value: "csrf" } : undefined,
    }),
}));
vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true) }));
vi.mock("@/lib/services/audit.service", () => ({ logAudit: vi.fn(), auditContext: () => ({ ipAddress: "127.0.0.1", userAgent: "test" }) }));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(csrf.validateCsrf).mockReturnValue(true);
    revokeSessionMock.mockResolvedValue({ ok: true, data: { revoked: true } });
  });

  it("returns 200 and clears cookies", async () => {
    validateSessionMock.mockResolvedValue({ ok: true, data: { accountId: "a1", userId: "u1" } });
    const request = new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": "x" },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data?.loggedOut).toBe(true);
    expect(response.headers.get("set-cookie")).toMatch(/westbridge_sid=;/);
  });

  it("returns 403 when CSRF invalid", async () => {
    vi.mocked(csrf.validateCsrf).mockReturnValue(false);
    const request = new Request("http://localhost/api/auth/logout", { method: "POST" });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
