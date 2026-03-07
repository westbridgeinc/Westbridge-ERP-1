import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const verifyIPNMock = vi.fn();
const isPaymentSuccessMock = vi.fn();
const markAccountPaidMock = vi.fn();
vi.mock("@/lib/services/billing.service", () => ({
  verifyIPN: (p: unknown) => verifyIPNMock(p),
  isPaymentSuccess: (p: unknown) => isPaymentSuccessMock(p),
  markAccountPaid: (...args: unknown[]) => markAccountPaidMock(...args),
}));
vi.mock("@/lib/ratelimit", () => ({ checkRateLimit: () => Promise.resolve({ allowed: true }), getClientIdentifier: () => "ip" }));
vi.mock("@/lib/services/audit.service", () => ({ logAudit: vi.fn(), auditContext: () => ({ ipAddress: "127.0.0.1", userAgent: "test" }) }));

describe("POST /api/webhooks/2checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyIPNMock.mockReturnValue(true);
    isPaymentSuccessMock.mockReturnValue(true);
    markAccountPaidMock.mockResolvedValue({ ok: true });
  });

  it("returns 401 when signature invalid", async () => {
    verifyIPNMock.mockReturnValue(false);
    const request = new Request("http://localhost/api/webhooks/2checkout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ REFNO: "1" }).toString(),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 200 OK when payment success and markAccountPaid succeeds", async () => {
    const request = new Request("http://localhost/api/webhooks/2checkout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        MERCHANT_ORDER_ID: "acc-1",
        ORDERNO: "ord-1",
      }).toString(),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });
});
