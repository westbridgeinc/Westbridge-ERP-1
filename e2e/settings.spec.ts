import { test, expect } from "@playwright/test";

/**
 * Settings page tests.
 *
 * The /dashboard/* routes are protected by middleware that validates a session
 * cookie against the backend.  In E2E we rely on the dev server running with a
 * backend that either accepts the cookie or returns demo/fallback data.
 *
 * If authentication is not available the middleware redirects to /login, so we
 * first assert the page did NOT redirect before running deeper checks.
 */

const SETTINGS_URL = "/dashboard/settings";

const TAB_LABELS = [
  "Profile",
  "Team",
  "Security",
  "Notifications",
  "Appearance",
  "Billing",
  "Integrations",
  "Modules",
  "API",
] as const;

test.describe("Settings page", () => {
  /* ------------------------------------------------------------------ */
  /*  Page load                                                          */
  /* ------------------------------------------------------------------ */

  test("settings page loads with tabs (or redirects to login if unauthenticated)", async ({ page }) => {
    await page.goto(SETTINGS_URL);

    // If the middleware redirected to /login the user is not authenticated.
    // Both outcomes are valid — we just need to know which path we're on.
    const url = page.url();

    if (url.includes("/login")) {
      // Unauthenticated — the redirect itself proves the middleware works.
      await expect(page).toHaveURL(/\/login/);
      return;
    }

    // Authenticated — settings page should render tabs.
    await expect(page.getByText("Settings").first()).toBeVisible();

    // At least the first tab ("Profile") must be visible.
    await expect(page.getByRole("tab", { name: /profile/i }).or(page.getByText("Profile").first())).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Tab switching                                                      */
  /* ------------------------------------------------------------------ */

  test("can switch between settings tabs", async ({ page }) => {
    await page.goto(SETTINGS_URL);

    if (page.url().includes("/login")) {
      test.skip(true, "Skipped — user is not authenticated");
      return;
    }

    // Verify multiple tab triggers are rendered.
    for (const label of TAB_LABELS) {
      const tabTrigger = page.getByRole("tab", { name: new RegExp(label, "i") })
        .or(page.locator(`[data-value="${label.toLowerCase()}"]`))
        .or(page.getByText(label, { exact: true }));
      await expect(tabTrigger.first()).toBeVisible();
    }

    // Click the "Security" tab and confirm its content appears.
    const securityTab = page.getByRole("tab", { name: /security/i })
      .or(page.getByText("Security", { exact: true }));
    await securityTab.first().click();

    // The security panel should show password-related content.
    await expect(
      page.getByText(/password/i).first(),
    ).toBeVisible();

    // Switch to "Appearance" tab.
    const appearanceTab = page.getByRole("tab", { name: /appearance/i })
      .or(page.getByText("Appearance", { exact: true }));
    await appearanceTab.first().click();

    // Appearance panel should mention theme.
    await expect(
      page.getByText(/theme/i).first(),
    ).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Profile form                                                       */
  /* ------------------------------------------------------------------ */

  test("profile form is visible on the default tab", async ({ page }) => {
    await page.goto(SETTINGS_URL);

    if (page.url().includes("/login")) {
      test.skip(true, "Skipped — user is not authenticated");
      return;
    }

    // The default tab is "Profile" (general).  It should show input fields.
    // The profile section has a display name input and an email field.
    const nameInput = page.locator('input[type="text"]').first()
      .or(page.getByPlaceholder(/name/i).first());
    await expect(nameInput).toBeVisible();

    // Email should also be shown (as text or input).
    await expect(page.getByText(/@/i).first()).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Tab via query parameter                                            */
  /* ------------------------------------------------------------------ */

  test("navigating with ?tab= query parameter selects the correct tab", async ({ page }) => {
    await page.goto(`${SETTINGS_URL}?tab=team`);

    if (page.url().includes("/login")) {
      test.skip(true, "Skipped — user is not authenticated");
      return;
    }

    // The Team tab content should be visible — it shows team members or an invite form.
    await expect(
      page.getByText(/team/i).first(),
    ).toBeVisible();

    // Should show invite-related UI or team member list.
    await expect(
      page.getByText(/invite/i).or(page.getByText(/member/i)).first(),
    ).toBeVisible();
  });
});
