import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for public routes only.
 *
 * These tests verify that key public pages load without crashing.
 * They do not require Supabase or a real AI provider.
 *
 * Authenticated flows require a real Supabase project and are documented
 * in docs/TESTING_STRATEGY.md under "Future E2E Plan."
 */

test.describe("Public route smoke tests", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/GameIQ/i);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("form")).toBeVisible();
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.locator("form")).toBeVisible();
  });

  test("request access page loads", async ({ page }) => {
    await page.goto("/request-access");
    // Should render a form or page content — not a 404
    await expect(page).not.toHaveTitle(/404/i);
    await expect(page.locator("main, [data-testid='page-content'], h1, form")).toBeVisible();
  });

  test("demo page loads", async ({ page }) => {
    await page.goto("/demo");
    await expect(page).not.toHaveTitle(/404/i);
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).not.toHaveTitle(/404/i);
  });
});
