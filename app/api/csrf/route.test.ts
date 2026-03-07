import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/csrf", () => ({
  generateCsrfToken: vi.fn(() => "mock-csrf-token"),
  CSRF_COOKIE_NAME: "westbridge_csrf",
  CSRF_HEADER_NAME: "x-csrf-token",
  CSRF_MAX_AGE_SECONDS: 3600,
}));

describe("GET /api/csrf", () => {
  it("returns 200 with token in data and header", async () => {
    const request = new Request("http://localhost/api/csrf");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data?.token).toBe("mock-csrf-token");
    expect(response.headers.get("x-csrf-token")).toBe("mock-csrf-token");
  });

  it("sets cookie with token", async () => {
    const request = new Request("http://localhost/api/csrf");
    const response = await GET(request);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("westbridge_csrf=");
    expect(setCookie).toContain("mock-csrf-token");
  });
});
