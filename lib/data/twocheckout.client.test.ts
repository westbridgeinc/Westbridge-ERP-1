import { describe, it, expect, vi, beforeAll } from "vitest";

describe("twocheckout.client", () => {
  beforeAll(async () => {
    process.env.TWOCO_SECRET_WORD = "s";
    process.env.TWOCO_LINK_STARTER = "https://pay.test/s";
    vi.resetModules();
  });
  it("getPaymentLinkUrl returns URL", async () => {
    const { getPaymentLinkUrl } = await import("./twocheckout.client");
    const url = getPaymentLinkUrl("Starter", "acc1", "https://r.com");
    expect(url).toContain("return_url");
  });
  it("getPaymentLinkUrl returns empty when no base", async () => {
    delete process.env.TWOCO_LINK_STARTER;
    vi.resetModules();
    const { getPaymentLinkUrl } = await import("./twocheckout.client");
    expect(getPaymentLinkUrl("Starter", "a", "https://r")).toBe("");
  });
  it("verifyIPNSignature returns false when no SECRET_WORD", async () => {
    process.env.TWOCO_SECRET_WORD = "";
    vi.resetModules();
    const { verifyIPNSignature } = await import("./twocheckout.client");
    expect(verifyIPNSignature({})).toBe(false);
  });
  it("verifyIPNSignature and isIPNSuccess branches", async () => {
    process.env.TWOCO_SECRET_WORD = "s";
    vi.resetModules();
    const { verifyIPNSignature, isIPNSuccess } = await import("./twocheckout.client");
    expect(verifyIPNSignature({})).toBe(false);
    expect(verifyIPNSignature({ MD5_HASH: "x" })).toBe(false);
    expect(isIPNSuccess({ MESSAGE_TYPE: "ORDER_CREATED" })).toBe(true);
    expect(isIPNSuccess({ STATUS: "COMPLETE" })).toBe(true);
    expect(isIPNSuccess({ STATUS: "APPROVED" })).toBe(true);
    expect(isIPNSuccess({ STATUS: "AUTH" })).toBe(true);
    expect(isIPNSuccess({ STATUS: "PENDING" })).toBe(false);
  });
});
