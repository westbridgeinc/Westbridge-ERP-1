import { describe, it, expect, vi } from "vitest";
let shouldThrow = false;
vi.mock("ioredis", () => ({
  default: class MockRedis {
    constructor() {
      if (shouldThrow) throw new Error("connect");
    }
  },
}));
describe("redis", () => {
  it("getRedis returns client when ioredis constructs", async () => {
    shouldThrow = false;
    vi.resetModules();
    const { getRedis } = await import("./redis");
    expect(getRedis()).not.toBeNull();
  });
  it("getRedis returns null when ioredis constructor throws", async () => {
    shouldThrow = true;
    vi.resetModules();
    const { getRedis } = await import("./redis");
    expect(getRedis()).toBeNull();
  });
});
