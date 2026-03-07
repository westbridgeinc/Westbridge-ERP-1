import { describe, it, expect } from "vitest";
import { getClientIdentifier } from "@/lib/api/rate-limit-tiers";

describe("rate limit (getClientIdentifier from rate-limit-tiers)", () => {
  describe("getClientIdentifier", () => {
    it("uses x-forwarded-for first", () => {
      const r = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
      expect(getClientIdentifier(r)).toBe("1.2.3.4");
    });
    it("uses x-real-ip when no forwarded-for", () => {
      const r = new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } });
      expect(getClientIdentifier(r)).toBe("9.9.9.9");
    });
    it("returns anonymous when no headers", () => {
      const r = new Request("http://x");
      expect(getClientIdentifier(r)).toBe("anonymous");
    });
  });
});
