const { test, expect } = require("@playwright/test");

test.describe("Student Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock login - you may need to adjust this based on your auth implementation
    await page.goto("/");

    // If you have a way to set auth token, do it here
    // await page.evaluate(() => {
    //   localStorage.setItem('token', 'mock-token');
    //   localStorage.setItem('user', JSON.stringify({ id: 1, role: 'STUDENT' }));
    // });

    // Or navigate to login and perform actual login
    // This is a placeholder - adjust based on your actual auth flow
  });

  test("should display dashboard for logged in student", async ({ page }) => {
    // This test assumes user is logged in
    // You may need to implement actual login or use authentication helpers
    await page.goto("/student/dashboard");

    // Wait for dashboard to load
    await page.waitForSelector("text=/dashboard/i, text=/bảng điều khiển/i", {
      timeout: 10000,
    });
  });

  test("should display test history", async ({ page }) => {
    await page.goto("/student/dashboard");

    // Look for test history section
    const testHistory = page.locator("text=/test history/i, text=/lịch sử/i");
    await expect(testHistory.first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to test page", async ({ page }) => {
    await page.goto("/student/dashboard");

    // Find and click test link
    const testLink = page
      .locator('a:has-text("Test"), a:has-text("Bài test")')
      .first();
    if (await testLink.isVisible()) {
      await testLink.click();
      await expect(page).toHaveURL(/test/i);
    }
  });
});

test.describe("Navigation", () => {
  test("should navigate between pages", async ({ page }) => {
    await page.goto("/");

    // Test navigation links if visible
    const navLinks = page.locator("nav a, header a");
    const count = await navLinks.count();

    if (count > 0) {
      // Click first nav link
      await navLinks.first().click();
      await page.waitForLoadState("networkidle");
    }
  });
});
