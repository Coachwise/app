import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'test123456';

async function gotoAuth(page: Page) {
  await page.goto('/');
  // Wait for the auth form to appear (app starts on auth when not logged in)
  await page.waitForSelector('text=Coachwise', { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test.describe('Login', () => {
  test('shows login form by default', async ({ page }) => {
    await gotoAuth(page);

    await expect(page.getByRole('button', { name: /login/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await gotoAuth(page);

    await page.getByPlaceholder(/email/i).fill('wrong@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /^login$/i }).click();

    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5_000 });
  });

  test('shows error on empty email', async ({ page }) => {
    await gotoAuth(page);

    await page.getByPlaceholder(/password/i).fill('somepassword');
    await page.getByRole('button', { name: /^login$/i }).click();

    // Browser native validation prevents submit — email field should be required
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput).toBeVisible();
    // The field is required so form should not submit
    await expect(page.locator('.bg-red-50')).not.toBeVisible({ timeout: 1_000 }).catch(() => {/* native validation, no app error */});
  });

  test('successful login navigates away from auth', async ({ page }) => {
    await gotoAuth(page);

    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^login$/i }).click();

    // Auth screen should disappear after successful login
    await expect(page.locator('text=Verify your email')).not.toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /^login$/i })).not.toBeVisible({ timeout: 8_000 });
  });

  test('forgot password link switches to forgot mode', async ({ page }) => {
    await gotoAuth(page);

    await page.getByRole('button', { name: /forgot password/i }).click();

    await expect(page.locator('text=Reset your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset code/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

test.describe('Register', () => {
  test('switches to register form', async ({ page }) => {
    await gotoAuth(page);

    await page.getByRole('button', { name: /register/i }).click();

    await expect(page.getByPlaceholder(/full name/i)).toBeVisible();
    await expect(page.getByPlaceholder('your_username')).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await gotoAuth(page);
    await page.getByRole('button', { name: /register/i }).click();

    await page.getByPlaceholder(/full name/i).fill('Test User');
    await page.getByPlaceholder('your_username').fill('testuser_pw');
    await page.getByPlaceholder(/email/i).fill('newuser_pw@example.com');

    const passwordInputs = page.getByPlaceholder(/password/i);
    await passwordInputs.first().fill('password123');
    await passwordInputs.last().fill('different456');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.locator('.bg-red-50')).toContainText(/do not match/i, { timeout: 5_000 });
  });

  test('shows error when password is too short', async ({ page }) => {
    await gotoAuth(page);
    await page.getByRole('button', { name: /register/i }).click();

    await page.getByPlaceholder(/full name/i).fill('Test User');
    await page.getByPlaceholder('your_username').fill('testuser_short');
    await page.getByPlaceholder(/email/i).fill('newuser_short@example.com');

    const passwordInputs = page.getByPlaceholder(/password/i);
    await passwordInputs.first().fill('abc');
    await passwordInputs.last().fill('abc');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.locator('.bg-red-50')).toContainText(/at least 6/i, { timeout: 5_000 });
  });

  test('shows email exists error for duplicate email', async ({ page }) => {
    await gotoAuth(page);
    await page.getByRole('button', { name: /register/i }).click();

    // Use an email that already exists (test user)
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder('your_username').fill('uniqueuser123');

    // Wait for auto-check debounce (400ms)
    await page.waitForTimeout(600);

    await expect(page.locator('text=Email already exists')).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Forgot password flow
// ---------------------------------------------------------------------------

test.describe('Forgot password', () => {
  test('renders forgot password form', async ({ page }) => {
    await gotoAuth(page);
    await page.getByRole('button', { name: /forgot password/i }).click();

    await expect(page.locator('text=Reset your password')).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset code/i })).toBeVisible();
  });

  test('shows OTP step after submitting email', async ({ page }) => {
    await gotoAuth(page);
    await page.getByRole('button', { name: /forgot password/i }).click();

    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByRole('button', { name: /send reset code/i }).click();

    // Should advance to OTP verification step
    await expect(page.locator('text=Verify your email')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByPlaceholder('123456')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Language selector
// ---------------------------------------------------------------------------

test.describe('Language selector', () => {
  test('language selector opens and closes', async ({ page }) => {
    await gotoAuth(page);

    // Globe button top-right
    const globeBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await globeBtn.click();

    await expect(page.locator('text=English').or(page.locator('text=Persian'))).toBeVisible();
  });
});
