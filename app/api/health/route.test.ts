import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockQueryRaw = vi.fn();
const mockRedisPing = vi.fn();
vi.mock("@/lib/data/prisma", () => ({
  prisma: {
    $queryRawUnsafe: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));
vi.mock("@/lib/env", () => ({
  validateEnv: () => ({ ok: true }),
  getEnvSummary: () => ({}),
}));
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({ ping: () => mockRedisPing() }),
}));
vi.stubGlobal(
  "fetch",
  vi.fn(() => Promise.resolve({ ok: true }))
);

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockRedisPing.mockResolvedValue("PONG");
  });

  it("returns 200 and healthy status when DB is up", async () => {
    const request = new Request("http://localhost/api/health");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data?.status).toBe("healthy");
    expect(json.data?.checks?.database?.status).toBe("ok");
    expect(json.data?.version).toBeDefined();
    expect(json.data?.uptime_seconds).toBeDefined();
  });

  it("returns 503 with unhealthy when DB fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("connection refused"));
    const request = new Request("http://localhost/api/health");
    const response = await GET(request);
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.data?.status).toBe("unhealthy");
    expect(json.data?.checks?.database?.status).toBe("error");
  });
});
