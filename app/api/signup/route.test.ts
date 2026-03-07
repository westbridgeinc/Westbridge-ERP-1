import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import * as csrf from "@/lib/csrf";

const createAccountMock = vi.fn();
vi.mock("@/lib/services/billing.service", () => ({ createAccount: (...args: unknown[]) => createAccountMock(...args) }));
vi.mock("@/lib/ratelimit", () => ({ checkRateLimit: () => Promise.resolve({ allowed: true }), getClientIdentifier: () => "id" }));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (name === "westbridge_csrf" ? { value: "csrf" } : undefined),
    }),
}));
vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true), CSRF_COOKIE_NAME: "westbridge_csrf" }));
vi.mock("@/lib/services/audit.service", () => ({ logAudit: vi.fn(), auditContext: () => ({ ipAddress: "127.0.0.1", userAgent: "test" }) }));

describe("POST /api/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(csrf.validateCsrf).mockReturnValue(true);
  });

  it("returns 200 and account data on success", async () => {
    createAccountMock.mockResolvedValue({
      ok: true,
      data: { accountId: "a1", email: "u@x.com", plan: "Starter" },
    });
    const request = new Request("http://localhost/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": "x" },
      body: JSON.stringify({
        email: "u@x.com",
        companyName: "Acme",
        plan: "Starter",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data?.accountId).toBe("a1");
  });

  it("returns 413 when body exceeds 1MB", async () => {
    const request = new Request("http://localhost/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "content-length": "1048577" },
      body: JSON.stringify({ email: "u@x.com", companyName: "A", plan: "Starter" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(413);
  });

  it("returns 403 when CSRF invalid", async () => {
    vi.mocked(csrf.validateCsrf).mockReturnValue(false);
    const request = new Request("http://localhost/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "u@x.com", companyName: "A", plan: "Starter" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
