import { test, expect } from '@playwright/test';
test('admin previews completion then sees an immutable roster', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('khiarukum-locale', 'en'),
  );
  let ended = false;
  const group = {
    id: 'g',
    nameEn: 'Morning group',
    program: { nameEn: 'Quran program' },
    minAttendancePercent: 80,
    minSatisfactoryPercent: 80,
  };
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: any = [];
    if (path.endsWith('/auth/me'))
      data = { id: 'a', role: 'ADMIN', firstName: 'Admin', lastName: 'Test' };
    else if (path.endsWith('/completion-preview'))
      data = {
        criteria: group,
        passedCount: 1,
        notPassedCount: 0,
        blockers: [],
      };
    else if (path.endsWith('/end')) {
      ended = true;
      data = { endedAt: '2026-09-30' };
    } else if (path.endsWith('/results'))
      data = [
        {
          id: 'r',
          studentName: 'مريم Ali',
          passed: true,
          presentCount: 4,
          applicableCount: 5,
          satisfactoryCount: 4,
        },
      ];
    else if (path.endsWith('/groups/g'))
      data = { ...group, endedAt: ended ? '2026-09-30' : null };
    await route.fulfill({
      json: {
        success: true,
        data,
        count: Array.isArray(data) ? data.length : undefined,
      },
    });
  });
  await page.goto('/groups/g');
  await page.getByRole('button', { name: 'End group', exact: true }).click();
  await expect(page.getByText('Passed: 1')).toBeVisible();
  await page
    .getByRole('button', { name: 'Confirm end group', exact: true })
    .click();
  await expect(page.getByText('مريم Ali')).toBeVisible();
  await expect(page.getByText('4/5 · 80.0%')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Edit', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'End group', exact: true }),
  ).toHaveCount(0);
});
