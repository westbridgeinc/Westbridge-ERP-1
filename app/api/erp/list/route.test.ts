import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { COOKIE } from "@/lib/constants";

const validateSessionMock = vi.fn();
const listMock = vi.fn();
vi.mock("@/lib/services/session.service", () => ({
  validateSession: (token: string) => validateSessionMock(token),
}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (name === COOKIE.SESSION_NAME ? { value: "session-token" } : undefined),
    }),
}));
vi.mock("@/lib/services/erp.service", () => ({
  list: (...args: unknown[]) => listMock(...args),
}));

describe("GET /api/erp/list", () => {
  beforeEach(() => {
    validateSessionMock.mockReset();
    listMock.mockReset();
    listMock.mockResolvedValue({ ok: true, data: [] });
  });

  it("returns 200 when session has role member (all roles can read list)", async () => {
    validateSessionMock.mockResolvedValue({
      ok: true,
      data: {
        userId: "u1",
        accountId: "a1",
        role: "member",
        erpnextSid: "erpsid",
      },
    });
    const request = new Request("http://localhost/api/erp/list?doctype=Sales%20Invoice");
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(listMock).toHaveBeenCalled();
  });

  it("returns 401 when validateSession fails", async () => {
    validateSessionMock.mockResolvedValue({ ok: false, error: "Invalid session" });
    const request = new Request("http://localhost/api/erp/list?doctype=Sales%20Invoice");
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
  });
});
