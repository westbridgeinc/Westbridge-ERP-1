import { test, expect } from "@playwright/test";
import { createTestSession } from "./fixtures/session";

test.describe("auth", () => {
  test("unauthenticated users are redirected from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with invalid credentials returns 401 and generic message", async ({ request }) => {
    const csrfRes = await request.get("/api/csrf");
    expect(csrfRes.ok()).toBe(true);
    const csrfData = await csrfRes.json();
    const token = csrfData.data?.token;
    const cookieHeader = csrfRes.headers()["set-cookie"] ?? "";
    const csrfCookie = cookieHeader.split(";")[0] ?? "";

    const loginRes = await request.post("/api/auth/login", {
      headers: {
        "content-type": "application/json",
        "x-csrf-token": token,
        cookie: csrfCookie,
      },
      data: { email: "nobody@example.com", password: "wrong" },
    });
    expect(loginRes.status()).toBe(401);
    const body = await loginRes.json();
    expect(body.error?.message).toBe("Invalid credentials");
  });

  test("login with valid credentials sets session cookie and redirects to /dashboard", async ({
    page,
    request,
  }) => {
    const email = process.env.E2E_TEST_LOGIN_EMAIL;
    const password = process.env.E2E_TEST_LOGIN_PASSWORD;
    test.skip(!email || !password, "E2E_TEST_LOGIN_EMAIL and E2E_TEST_LOGIN_PASSWORD must be set for this test");

    await page.goto("/login");
    const csrfRes = await request.get("/api/csrf");
    const csrfData = await csrfRes.json();
    const token = csrfData.data?.token;
    const domain = new URL(process.env.BASE_URL ?? "http://localhost:3000").hostname;
    if (token) {
      await page.context().addCookies([{ name: "westbridge_csrf", value: token, domain, path: "/" }]);
    }
    await page.fill('input[type="email"]', email ?? "");
    await page.fill('input[type="password"]', password ?? "");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    const sessionCookie = (await page.context().cookies()).find((c) => c.name === "westbridge_sid");
    expect(sessionCookie?.value).toBeTruthy();
  });

  test("logout clears session cookie and redirects to /login", async ({ page, request }) => {
    const sess = await createTestSession("owner");
    const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
    const domain = new URL(baseUrl).hostname;
    try {
      await page.context().addCookies([
        { name: "westbridge_sid", value: sess.sessionCookie, domain, path: "/" },
      ]);
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard/);

      const csrfRes = await request.get("/api/csrf", { headers: { cookie: `westbridge_sid=${sess.sessionCookie}` } });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.token;
      const setCookie = csrfRes.headers()["set-cookie"];
      const csrfCookiePart = setCookie?.split(";")[0] ?? "";

      const logoutRes = await request.post("/api/auth/logout", {
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `westbridge_sid=${sess.sessionCookie}; ${csrfCookiePart}`,
        },
      });
      expect(logoutRes.ok()).toBe(true);
      expect(String(logoutRes.headers()["set-cookie"])).toMatch(/westbridge_sid=;/);
    } finally {
      await sess.cleanup();
    }
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("accessing /api/erp/list without session returns 401", async ({ request }) => {
    const res = await request.get("/api/erp/list?doctype=Sales%20Invoice");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error?.code).toBe("UNAUTHORIZED");
  });
});
