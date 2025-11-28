const { test, expect } = require("@playwright/test");

test.describe("Performance Tests", () => {
  test("homepage should load quickly", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Homepage should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("dashboard should load quickly", async ({ page }) => {
    await page.goto("/student/dashboard");

    const startTime = Date.now();
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // Dashboard should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("should have good Lighthouse scores", async ({ page }) => {
    // This requires lighthouse plugin
    // For now, we'll just check basic metrics
    await page.goto("/");

    const metrics = await page.evaluate(() => {
      return {
        domContentLoaded:
          performance.timing.domContentLoadedEventEnd -
          performance.timing.navigationStart,
        loadComplete:
          performance.timing.loadEventEnd - performance.timing.navigationStart,
      };
    });

    // DOM should be ready in under 2 seconds
    expect(metrics.domContentLoaded).toBeLessThan(2000);

    // Page should fully load in under 3 seconds
    expect(metrics.loadComplete).toBeLessThan(3000);
  });

  test("should not have memory leaks on navigation", async ({ page }) => {
    await page.goto("/");

    const initialMemory = await page.evaluate(
      () => performance.memory?.usedJSHeapSize || 0
    );

    // Navigate a few times
    for (let i = 0; i < 5; i++) {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    }

    const finalMemory = await page.evaluate(
      () => performance.memory?.usedJSHeapSize || 0
    );

    // Memory increase should be reasonable (less than 50MB)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
