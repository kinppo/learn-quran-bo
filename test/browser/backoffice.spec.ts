import { test, expect } from '@playwright/test';
test('protects routes and displays only Arabic and English', async ({
  page,
}) => {
  await page.route('**/api/v1/**', (r) =>
    r.fulfill({
      status: 401,
      json: { success: false, error: { message: 'Unauthorized' } },
    }),
  );
  await page.goto('/groups');
  await expect(page).toHaveURL(/login/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(
    page.getByRole('button', { name: 'تسجيل الدخول', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Language / اللغة').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Language / اللغة').locator('option'),
  ).toHaveCount(2);
});
test('shows failed requests and empty lists without fabricated data', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('khiarukum-locale', 'en'));
  await page.route('**/api/v1/**', (r) =>
    r.fulfill({
      json: {
        success: true,
        data: r.request().url().includes('/auth/me')
          ? { id: 'admin', firstName: 'Admin', lastName: 'Test', role: 'ADMIN' }
          : [],
        count: 0,
      },
    }),
  );
  await page.goto('/categories');
  await expect(page.getByText('No records found')).toBeVisible();
  await page.getByRole('link', { name: '+ Add Category' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByText('Check the highlighted fields').first(),
  ).toBeVisible();
  await page.getByLabel('Name in Arabic').fill('فئة');
  await page.getByLabel('Name in English').fill('Category');
  await page.route('**/api/v1/categories', (r) =>
    r.fulfill({
      status: 409,
      json: { success: false, error: { message: 'overlap' } },
    }),
  );
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByText('This record already exists or is linked to other records.'),
  ).toBeVisible();
});
test('responsive Arabic shell has no horizontal overflow', async ({ page }) => {
  await page.route('**/api/v1/**', (r) =>
    r.fulfill({
      json: {
        success: true,
        data: r.request().url().includes('/auth/me')
          ? {
              id: 'admin',
              firstName: 'مدير',
              lastName: 'اختبار',
              role: 'ADMIN',
            }
          : [],
        count: 0,
      },
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/students');
  await expect(
    page.getByRole('heading', { name: 'شؤون الطلاب' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'القائمة', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'الحلقات', exact: true }),
  ).toBeVisible();
});
