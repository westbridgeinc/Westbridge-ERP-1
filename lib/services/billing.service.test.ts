import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.fn();
const deleteMock = vi.fn();
const createMock = vi.fn();
const updateManyMock = vi.fn();
vi.mock("@/lib/data/prisma", () => ({
  prisma: {
    account: {
      findUnique: findUniqueMock,
      delete: deleteMock,
      create: createMock,
      updateMany: updateManyMock,
    },
  },
}));

const getPaymentLinkUrlMock = vi.fn();
vi.mock("@/lib/data/twocheckout.client", () => ({
  getPaymentLinkUrl: getPaymentLinkUrlMock,
  verifyIPNSignature: vi.fn(() => true),
  isIPNSuccess: vi.fn(() => false),
}));

describe("billing.service", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    deleteMock.mockReset();
    createMock.mockReset();
    updateManyMock.mockReset();
    getPaymentLinkUrlMock.mockReset();
    getPaymentLinkUrlMock.mockReturnValue("https://checkout.example/pay");
  });

  it("returns error when email is missing", async () => {
    const { createAccount } = await import("./billing.service");
    const result = await createAccount(
      { email: "", companyName: "Acme", plan: "Starter" },
      "http://localhost:3000"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("required");
  });

  it("returns error for invalid plan", async () => {
    const { createAccount } = await import("./billing.service");
    const result = await createAccount(
      { email: "a@b.com", companyName: "Acme", plan: "InvalidPlan" },
      "http://localhost:3000"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid plan");
  });

  it("returns error when account with email already exists and is active", async () => {
    findUniqueMock.mockResolvedValue({ id: "acc-1", email: "a@b.com", status: "active" });
    const { createAccount } = await import("./billing.service");
    const result = await createAccount(
      { email: "a@b.com", companyName: "Acme", plan: "Starter" },
      "http://localhost:3000"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("already exists");
  });

  it("creates account with valid input", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "acc-new",
      email: "new@b.com",
      companyName: "New Co",
      plan: "Starter",
      status: "pending",
    });
    const { createAccount } = await import("./billing.service");
    const result = await createAccount(
      { email: "new@b.com", companyName: "New Co", plan: "Starter" },
      "http://localhost:3000"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.accountId).toBe("acc-new");
      expect(result.data.status).toBe("pending");
    }
    expect(createMock).toHaveBeenCalledWith({
      data: {
        email: "new@b.com",
        companyName: "New Co",
        plan: "Starter",
        modulesSelected: [],
        status: "pending",
      },
    });
  });

  it("deletes existing inactive account and creates new", async () => {
    findUniqueMock.mockResolvedValue({ id: "old", email: "a@b.com", status: "pending" });
    deleteMock.mockResolvedValue({});
    createMock.mockResolvedValue({ id: "acc-2", email: "a@b.com", companyName: "Acme", plan: "Starter", status: "pending" });
    const { createAccount } = await import("./billing.service");
    const result = await createAccount(
      { email: "a@b.com", companyName: "Acme", plan: "Starter" },
      "http://localhost:3000"
    );
    expect(deleteMock).toHaveBeenCalledWith({ where: { email: "a@b.com" } });
    expect(result.ok).toBe(true);
  });

  it("verifyIPN and isPaymentSuccess delegate to client", async () => {
    const { verifyIPN, isPaymentSuccess } = await import("./billing.service");
    expect(verifyIPN({})).toBe(true);
    expect(isPaymentSuccess({})).toBe(false);
  });

  it("markAccountPaid updates account and returns result", async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    const { markAccountPaid } = await import("./billing.service");
    const r = await markAccountPaid("acc-1", "ord-1", "cust-1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.updated).toBe(true);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { status: "active", twocoOrderId: "ord-1", twocoCustomerId: "cust-1" },
    });
  });
});
