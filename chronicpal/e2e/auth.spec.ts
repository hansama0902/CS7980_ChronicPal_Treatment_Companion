import { test, expect } from '@playwright/test';

// Unique email per test run to avoid conflicts across CI runs
const TEST_EMAIL = `e2e-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Auth pages', () => {
  test('root redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'ChronicPal' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Account' })).toBeVisible();
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'ChronicPal' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  });

  test('login → register toggle navigates correctly', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/register/);
    await page.getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows error on invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });
});

test.describe('Auth flow', () => {
  test('register → auto-login → dashboard', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();
  });

  test('login with registered credentials → dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test('protected /dashboard redirects if not logged in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
