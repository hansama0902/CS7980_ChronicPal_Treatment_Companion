import { test, expect } from '@playwright/test';

const USER_EMAIL = `flow-${Date.now()}@example.com`;
const USER_PASSWORD = 'FlowTest123!';

test.describe('CP-15: Critical patient flow', () => {
  test('register → login → log treatment → view dashboard → generate summary', async ({ page }) => {
    // 1. Register
    await page.goto('/register');
    await page.getByLabel('Email').fill(USER_EMAIL);
    await page.getByRole('textbox', { name: 'Password' }).fill(USER_PASSWORD);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/(dashboard|login)/, { timeout: 15_000 });

    if (page.url().includes('/login')) {
      await page.getByLabel('Email').fill(USER_EMAIL);
      await page.getByRole('textbox', { name: 'Password' }).fill(USER_PASSWORD);
      await page.getByRole('button', { name: 'Log In' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    }

    // 2. Dashboard is visible
    await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();

    // 3. Navigate to treatments and log one
    await page.goto('/dashboard/treatments');
    await expect(page).toHaveURL(/\/dashboard\/treatments/);

    // Open the add-treatment modal first
    await page.getByRole('button', { name: /Log Treatment/i }).click();

    // Fill treatment form (inside modal)
    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 5_000 });
    await dateInput.fill('2026-04-19');

    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('INFUSION');
    }

    await page.getByRole('button', { name: /^Save$/i }).click();

    // 4. Return to dashboard — stat cards should render
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();
    await expect(page.getByText('Next Treatment')).toBeVisible();

    // 5. Navigate to summary page
    await page.goto('/dashboard/summary');
    await expect(page).toHaveURL(/\/dashboard\/summary/);

    // Generate summary button should be present
    const generateBtn = page.getByRole('button', { name: /generate/i });
    await expect(generateBtn).toBeVisible();

    // Page should show AI disclaimer
    await expect(page.getByText(/AI-generated|not medical advice/i)).toBeVisible();
  });

  test('protected routes redirect to /login when unauthenticated', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/treatments',
      '/dashboard/labs',
      '/dashboard/symptoms',
      '/dashboard/summary',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
    }
  });

  test('caregiver dashboard redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/caregiver/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
