import { test, expect } from '@playwright/test';
test('dashboard review links, totals and error recovery', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('khiarukum-locale', 'en'),
  );
  let fail = true;
  await page.route('**/api/v1/**', (r) => {
    const url = new URL(r.request().url());
    if (url.pathname.endsWith('/auth/me'))
      return r.fulfill({
        json: {
          success: true,
          data: {
            id: 'admin',
            role: 'ADMIN',
            firstName: 'Admin',
            lastName: 'Test',
          },
        },
      });
    if (url.pathname.endsWith('/teachers') && fail)
      return r.fulfill({ status: 500, json: { success: false } });
    const waiting = url.searchParams.get('status') === 'WAITING';
    const rows =
      url.searchParams.get('limit') === '5'
        ? [
            {
              userId: waiting ? 'waiting-id' : 'recent-id',
              user: {
                firstName: waiting ? 'Waiting' : 'Recent',
                lastName: 'Student',
                status: waiting ? 'WAITING' : 'ACTIVE',
                createdAt: '2026-09-01T00:00:00Z',
              },
            },
          ]
        : [];
    return r.fulfill({
      json: { success: true, data: rows, count: waiting ? 7 : 42 },
    });
  });
  await page.goto('/dashboard');
  await expect(page.getByText('Waiting accounts: 7')).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Waiting Student/ }),
  ).toHaveAttribute('href', '/edit-student/waiting-id');
  await expect(
    page.getByRole('link', { name: /Recent Student/ }),
  ).toHaveAttribute('href', '/edit-student/recent-id');
  await expect(page.getByText('Unavailable — refresh to retry')).toBeVisible();
  await expect(page.locator('.dashboard-metric').first()).toContainText('42');
  await expect(
    page.getByRole('link', { name: 'View all' }).first(),
  ).toHaveAttribute(
    'href',
    '/students?status=WAITING&orderBy=createdAt&order=asc',
  );
  fail = false;
  await page.getByRole('button', { name: 'Refresh overview' }).click();
  await expect(page.getByText('Unavailable — refresh to retry')).toHaveCount(0);
  await expect(page.locator('.dashboard-metric').nth(1)).toContainText('42');
});
test('empty Arabic dashboard fits mobile', async ({ page }) => {
  await page.route('**/api/v1/**', (r) =>
    r.fulfill({
      json: {
        success: true,
        count: 0,
        data: r.request().url().includes('/auth/me')
          ? {
              id: 'admin',
              role: 'ADMIN',
              firstName: 'مدير',
              lastName: 'اختبار',
            }
          : [],
      },
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('لا يوجد طلاب بانتظار المراجعة.')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.dashboard-students')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
