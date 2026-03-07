import { test, expect } from "@playwright/test";
import { createTestSession } from "./fixtures/session";

test.describe("csrf", () => {
  test("POST to /api/erp/doc without CSRF token returns 403", async ({ request }) => {
    const sess = await createTestSession("owner");
    try {
      const res = await request.post("/api/erp/doc", {
        headers: {
          "content-type": "application/json",
          cookie: `westbridge_sid=${sess.sessionCookie}`,
        },
        data: { doctype: "Customer", customer_name: "Test" },
      });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.error?.message).toMatch(/CSRF|Invalid or missing/);
    } finally {
      await sess.cleanup();
    }
  });

  test("GET /api/csrf returns a token in both cookie and response header", async ({ request }) => {
    const res = await request.get("/api/csrf");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data?.token).toBeTruthy();
    const token = body.data.token as string;
    const setCookie = res.headers()["set-cookie"];
    expect(setCookie).toContain("westbridge_csrf=");
    expect(setCookie).toContain(token);
    const headerToken = res.headers()["x-csrf-token"];
    expect(headerToken).toBe(token);
  });
});
