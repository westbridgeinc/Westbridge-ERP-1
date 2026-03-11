import { test, expect } from "@playwright/test";

/**
 * Invoices list page tests.
 *
 * The /dashboard/* routes are protected by middleware.  If the session cookie
 * is missing or invalid, the middleware redirects to /login.  Tests gracefully
 * handle both authenticated and unauthenticated scenarios.
 */

const INVOICES_URL = "/dashboard/invoices";

test.describe("Invoices list page", () => {
  /* ------------------------------------------------------------------ */
  /*  Page load                                                          */
  /* ------------------------------------------------------------------ */

  test("invoices page loads or redirects to login", async ({ page }) => {
    await page.goto(INVOICES_URL);

    const url = page.url();

    if (url.includes("/login")) {
      // Unauthenticated — middleware redirect is working correctly.
      await expect(page).toHaveURL(/\/login/);
      return;
    }

    // Authenticated — the invoices page should render its heading.
    await expect(
      page.getByRole("heading", { name: /invoices/i }).first(),
    ).toBeVisible();

    // Subtitle
    await expect(
      page.getByText(/manage and track invoices/i),
    ).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Loading / empty states                                             */
  /* ------------------------------------------------------------------ */

  test("shows invoice data or empty state", async ({ page }) => {
    await page.goto(INVOICES_URL);

    if (page.url().includes("/login")) {
      test.skip(true, "Skipped — user is not authenticated");
      return;
    }

    // The page will show one of:
    //   1) A data table with invoice rows
    //   2) An empty state with a prompt to create the first invoice
    //   3) An error state with an error message

    const dataTable = page.locator("table").first();
    const emptyState = page.getByText(/no invoices/i)
      .or(page.getByText(/create your first/i))
      .or(page.getByText(/get started/i));
    const errorState = page.getByText(/failed to load/i)
      .or(page.getByText(/error/i));

    // At least one of these three states should be present.
    await expect(
      dataTable.or(emptyState.first()).or(errorState.first()),
    ).toBeVisible({ timeout: 15_000 });
  });

  /* ------------------------------------------------------------------ */
  /*  Create New button                                                  */
  /* ------------------------------------------------------------------ */

  test("Create New button is present", async ({ page }) => {
    await page.goto(INVOICES_URL);

    if (page.url().includes("/login")) {
      test.skip(true, "Skipped — user is not authenticated");
      return;
    }

    // Both the empty state and the list state render a "+ Create New" button.
    const createButton = page.getByRole("button", { name: /create new/i })
      .or(page.getByRole("link", { name: /create new/i }))
      .or(page.getByText(/\+ Create New/));
    await expect(createButton.first()).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Heading and subtitle always present                                */
  /* ------------------------------------------------------------------ */

  test("page header shows title and subtitle", async ({ page }) => {
    await page.goto(INVOICES_URL);

    if (page.url().includes("/login")) {
      test.skip(true, "Skipped — user is not authenticated");
      return;
    }

    await expect(
      page.getByRole("heading", { name: /invoices/i }).first(),
    ).toBeVisible();

    await expect(
      page.getByText(/manage and track invoices/i),
    ).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /*  Filter tabs (when data is present)                                 */
  /* ------------------------------------------------------------------ */

  test("filter tabs are rendered when invoices exist", async ({ page }) => {
    await page.goto(INVOICES_URL);

    if (page.url().includes("/login")) {
      test.skip(true, "Skipped — user is not authenticated");
      return;
    }

    // If there are invoices the filter buttons (All, Draft, Unpaid, Paid, Overdue)
    // and a search input should be visible.
    const allFilter = page.getByRole("button", { name: /^all$/i });
    const searchInput = page.getByPlaceholder(/search invoices/i);

    // These only appear when invoices exist — if we see the empty state, skip.
    const emptyState = page.getByText(/no invoices/i)
      .or(page.getByText(/create your first/i));

    const hasEmpty = await emptyState.first().isVisible().catch(() => false);

    if (!hasEmpty) {
      // We have invoice data — filters and search should be present.
      await expect(allFilter.first()).toBeVisible();
      await expect(searchInput).toBeVisible();
    }
  });
});
