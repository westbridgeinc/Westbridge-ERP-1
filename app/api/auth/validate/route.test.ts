import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { COOKIE } from "@/lib/constants";

const validateSessionMock = vi.fn();
vi.mock("@/lib/services/session.service", () => ({
  validateSession: (t: string, _r?: Request) => validateSessionMock(t),
}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (name === COOKIE.SESSION_NAME ? { value: "sid" } : undefined),
    }),
}));

describe("GET /api/auth/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with userId and accountId when session valid", async () => {
    validateSessionMock.mockResolvedValue({
      ok: true,
      data: { userId: "u1", accountId: "a1" },
    });
    const request = new Request("http://localhost/api/auth/validate");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data?.userId).toBe("u1");
    expect(json.data?.accountId).toBe("a1");
  });

  it("returns 401 when validateSession fails", async () => {
    validateSessionMock.mockResolvedValue({ ok: false, error: "Invalid session" });
    const request = new Request("http://localhost/api/auth/validate");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
