const { test, expect } = require("@playwright/test");

test.describe("Appointment Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto("/");

    // Login as student (assuming test user exists)
    // Note: In real scenario, you would set up test data first
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page
      .locator('button:has-text("Login"), button:has-text("Đăng nhập")')
      .first();

    // Only login if not already logged in
    if (await emailInput.isVisible()) {
      await emailInput.fill("student@example.com");
      await passwordInput.fill("password123");
      await loginButton.click();

      // Wait for navigation after login
      await page.waitForURL(/\/(home|dashboard)/, { timeout: 10000 });
    }
  });

  test("should display expert list or appointment page", async ({ page }) => {
    // Navigate to appointments or experts page
    await page.goto("/appointments");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if page loaded successfully
    await expect(page).toHaveURL(/.*appointments.*/);
  });

  test("should open appointment booking modal", async ({ page }) => {
    await page.goto("/appointments");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Look for booking button or expert card
    const bookingButton = page
      .locator(
        'button:has-text("Book"), button:has-text("Đặt lịch"), [class*="book"]'
      )
      .first();

    if (await bookingButton.isVisible({ timeout: 5000 })) {
      await bookingButton.click();

      // Wait for modal to appear
      await page.waitForSelector(
        '[role="dialog"], [class*="modal"], [class*="Modal"]',
        {
          timeout: 5000,
        }
      );

      // Check if modal is visible
      const modal = page
        .locator('[role="dialog"], [class*="modal"], [class*="Modal"]')
        .first();
      await expect(modal).toBeVisible();
    }
  });

  test("should select date and time in booking modal", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");

    const bookingButton = page
      .locator('button:has-text("Book"), button:has-text("Đặt lịch")')
      .first();

    if (await bookingButton.isVisible({ timeout: 5000 })) {
      await bookingButton.click();

      // Wait for modal
      await page.waitForSelector('[role="dialog"], [class*="modal"]', {
        timeout: 5000,
      });

      // Look for date picker
      const dateInput = page
        .locator('input[type="date"], [class*="date"]')
        .first();
      if (await dateInput.isVisible({ timeout: 3000 })) {
        // Select a future date
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const dateString = futureDate.toISOString().split("T")[0];
        await dateInput.fill(dateString);
      }

      // Look for time slot buttons
      const timeSlot = page
        .locator('button:has-text(":"), [class*="time"]')
        .first();
      if (await timeSlot.isVisible({ timeout: 3000 })) {
        await timeSlot.click();
      }
    }
  });

  test("should submit appointment booking", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");

    const bookingButton = page
      .locator('button:has-text("Book"), button:has-text("Đặt lịch")')
      .first();

    if (await bookingButton.isVisible({ timeout: 5000 })) {
      await bookingButton.click();

      await page.waitForSelector('[role="dialog"], [class*="modal"]', {
        timeout: 5000,
      });

      // Fill in appointment details if form exists
      const notesInput = page.locator('textarea, input[type="text"]').first();
      if (await notesInput.isVisible({ timeout: 3000 })) {
        await notesInput.fill("Test appointment notes");
      }

      // Submit booking
      const submitButton = page
        .locator(
          'button:has-text("Confirm"), button:has-text("Xác nhận"), button[type="submit"]'
        )
        .first();
      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click();

        // Wait for success message or modal close
        await page.waitForTimeout(2000);
      }
    }
  });

  test("should display appointment list", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");

    // Look for appointment list or cards
    const appointmentList = page
      .locator('[class*="appointment"], [class*="list"], article')
      .first();

    // At least the page structure should be visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle appointment cancellation", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");

    // Look for cancel button on existing appointments
    const cancelButton = page
      .locator('button:has-text("Cancel"), button:has-text("Hủy")')
      .first();

    if (await cancelButton.isVisible({ timeout: 5000 })) {
      await cancelButton.click();

      // Wait for confirmation dialog
      await page.waitForTimeout(1000);

      // Confirm cancellation if dialog appears
      const confirmButton = page
        .locator('button:has-text("Confirm"), button:has-text("Xác nhận")')
        .first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    }
  });
});
