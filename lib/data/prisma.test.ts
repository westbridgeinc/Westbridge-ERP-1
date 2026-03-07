import { describe, it, expect, vi } from "vitest";

vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class MockAdapter {} }));
vi.mock("@/lib/generated/prisma/client", () => ({ PrismaClient: class MockClient {} }));

describe("prisma", () => {
  it("exports prisma client", async () => {
    vi.resetModules();
    const { prisma } = await import("./prisma");
    expect(prisma).toBeDefined();
  });
});
