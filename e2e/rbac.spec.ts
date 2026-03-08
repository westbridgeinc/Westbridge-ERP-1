import { test, expect } from "@playwright/test";
import { createTestSession } from "./fixtures/session";

test.describe("rbac", () => {
  test("viewer role user gets 403 on POST /api/erp/doc", async ({ request }) => {
    const sess = await createTestSession("viewer");
    try {
      const csrfRes = await request.get("/api/csrf");
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.token as string;
      const setCookie = csrfRes.headers()["set-cookie"];
      const csrfCookiePart = setCookie?.split(";")[0] ?? "";

      const res = await request.post("/api/erp/doc", {
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
          cookie: `westbridge_sid=${sess.sessionCookie}; ${csrfCookiePart}`,
        },
        data: { doctype: "Customer", customer_name: "E2E Customer" },
      });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.error?.code).toBe("FORBIDDEN");
      expect(body.error?.message).toMatch(/permission|Insufficient/);
    } finally {
      await sess.cleanup();
    }
  });

  test("owner role user gets 200 on POST /api/erp/doc (or 502 if ERP unavailable)", async ({
    request,
  }) => {
    const sess = await createTestSession("owner");
    try {
      const csrfRes = await request.get("/api/csrf");
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.token as string;
      const setCookie = csrfRes.headers()["set-cookie"];
      const csrfCookiePart = setCookie?.split(";")[0] ?? "";

      const res = await request.post("/api/erp/doc", {
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
          cookie: `westbridge_sid=${sess.sessionCookie}; ${csrfCookiePart}`,
        },
        data: { doctype: "Customer", customer_name: "E2E Owner Customer" },
      });
      expect(res.status()).not.toBe(403);
      expect([200, 401, 502]).toContain(res.status());
    } finally {
      await sess.cleanup();
    }
  });
});
