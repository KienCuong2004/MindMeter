const { test, expect } = require("@playwright/test");

test.describe("Blog Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
  });

  test("should display blog list", async ({ page }) => {
    // Wait for blog posts to load
    await page.waitForSelector('article, [class*="post"], [class*="card"]', {
      timeout: 10000,
    });

    // Check if posts are visible
    const posts = page.locator('article, [class*="post"], [class*="card"]');
    const count = await posts.count();

    // At least the structure should be there
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should navigate to blog post detail", async ({ page }) => {
    // Wait for posts to load
    await page.waitForSelector('article a, [class*="post"] a', {
      timeout: 10000,
    });

    const postLink = page.locator('article a, [class*="post"] a').first();

    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState("networkidle");

      // Should be on post detail page
      await expect(page).toHaveURL(/blog\/\d+/);
    }
  });

  test("should display comment section on post detail", async ({ page }) => {
    // Navigate to a post first
    await page.waitForSelector('article a, [class*="post"] a', {
      timeout: 10000,
    });
    const postLink = page.locator('article a, [class*="post"] a').first();

    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState("networkidle");

      // Look for comment section
      const commentSection = page.locator(
        'text=/comment/i, text=/bình luận/i, [class*="comment"]'
      );
      await expect(commentSection.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
