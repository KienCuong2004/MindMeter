const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/MindMeter/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Đăng nhập")');
    await loginButton.click();
    
    // Wait for validation messages
    await expect(page.locator('text=/email/i, text=/email/i')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Đăng nhập")');
    await loginButton.click();
    
    await expect(page.locator('text=/invalid/i, text=/không hợp lệ/i')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    const registerLink = page.locator('a:has-text("Register"), a:has-text("Đăng ký")');
    await registerLink.click();
    
    await expect(page).toHaveURL(/register/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Quên")');
    await forgotPasswordLink.click();
    
    await expect(page).toHaveURL(/forgot-password/i);
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="confirm"], input[placeholder*="xác nhận"]')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[placeholder*="confirm"], input[placeholder*="xác nhận"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await confirmPasswordInput.fill('password456');
    
    const registerButton = page.locator('button:has-text("Register"), button:has-text("Đăng ký")');
    await registerButton.click();
    
    await expect(page.locator('text=/match/i, text=/không khớp/i')).toBeVisible();
  });

  test('should require terms agreement', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[placeholder*="confirm"], input[placeholder*="xác nhận"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await confirmPasswordInput.fill('password123');
    
    const registerButton = page.locator('button:has-text("Register"), button:has-text("Đăng ký")');
    await registerButton.click();
    
    await expect(page.locator('text=/terms/i, text=/điều khoản/i')).toBeVisible();
  });
});

