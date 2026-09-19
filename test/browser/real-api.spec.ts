import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
test('real backend: admin login, bilingual CRUD, schedule edits, student filters and logout', async ({
  page,
  request,
}) => {
  test.skip(
    process.env.KHIARUKUM_REAL_E2E !== '1',
    'Requires the local backend and explicit integration opt-in',
  );
  const env = parseEnv(fs.readFileSync('../backend/.env', 'utf8'));
  const api = 'http://127.0.0.1:18000/api/v1';
  const login = await request.post(api + '/auth/login', {
    data: {
      identifier: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      client: 'mobile',
    },
  });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).data.accessToken;
  const headers = { authorization: 'Bearer ' + token };
  const created: { path: string; id: string }[] = [];
  const stamp = Date.now();
  const require = createRequire(import.meta.url);
  const {
    PrismaClient,
  } = require('../../../backend/node_modules/@prisma/client');
  const db = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });
  expect(['localhost', '127.0.0.1']).toContain(
    new URL(env.DATABASE_URL).hostname,
  );
  async function create(path: string, data: unknown) {
    const r = await request.post(api + path, { headers, data });
    expect(r.ok(), await r.text()).toBeTruthy();
    const row = (await r.json()).data;
    created.unshift({ path, id: row.id });
    return row;
  }
  try {
    const categories = (
      await (
        await request.get(api + '/categories?limit=100', { headers })
      ).json()
    ).data;
    const category =
      categories.find(
        (c: any) =>
          c.minAge <= 26 && c.maxAge >= 26 && ['M', 'ALL'].includes(c.gender),
      ) ||
      (await create('/categories', {
        nameAr: 'اختبار الواجهة',
        nameEn: 'UI test category',
        minAge: 0,
        maxAge: 120,
        gender: 'ALL',
      }));
    const riwaya = await create('/riwayat', {
      nameAr: 'رواية اختبار ' + stamp,
      nameEn: 'UI riwaya ' + stamp,
    });
    const program = await create('/programs', {
      nameAr: 'برنامج اختبار ' + stamp,
      nameEn: 'UI program ' + stamp,
      weeklySessionsCount: 1,
      memorizationDenominator: 8,
      revisionDenominator: 1,
      categoryIds: [category.id],
    });
    const teacher = await create('/teachers', {
      firstName: 'UI',
      lastName: 'Teacher' + stamp,
      email: `teacher${stamp}@example.test`,
      username: 'teacher' + stamp,
      password: 'Browser-test-only-42',
      locale: 'en',
      languageCodes: ['ar'],
      riwayaIds: [riwaya.id],
    });
    await page.addInitScript(() => localStorage.setItem('khiarukum-locale', 'en'));
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(env.ADMIN_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(env.ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/add-riwaya');
    await page.getByLabel('Name in Arabic').fill('رواية واجهة ' + stamp);
    await page.getByLabel('Name in English').fill('Browser riwaya ' + stamp);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/riwayat$/);
    await page
      .getByLabel('Search', { exact: true })
      .fill('Browser riwaya ' + stamp);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page
      .getByRole('link', { name: 'Browser riwaya ' + stamp, exact: true })
      .click();
    const addedId = page.url().split('/').pop()!;
    created.unshift({ path: '/riwayat', id: addedId });
    await page.getByLabel('Name in English').fill('Edited riwaya ' + stamp);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/riwayat$/);
    await page.goto('/add-group');
    await page.getByLabel('Name in Arabic').fill('حلقة واجهة ' + stamp);
    await page.getByLabel('Name in English').fill('Browser group ' + stamp);
    await page.getByLabel('Program', { exact: true }).selectOption(program.id);
    await page.getByLabel('Riwaya', { exact: true }).selectOption(riwaya.id);
    await page
      .getByLabel('Teachers', { exact: true })
      .selectOption([teacher.id]);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/groups$/);
    await page
      .getByLabel('Search', { exact: true })
      .fill('Browser group ' + stamp);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page
      .getByRole('link', { name: 'Browser group ' + stamp, exact: true })
      .click();
    const groupId = page.url().split('/').pop()!;
    created.unshift({ path: '/groups', id: groupId });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/groups$/);
    const group = (
      await (await request.get(api + '/groups/' + groupId, { headers })).json()
    ).data;
    expect(group.planning).toHaveLength(1);
    await page.goto('/edit-teacher/' + teacher.id);
    await page.getByLabel('First name in English').fill('English teacher');
    await page.getByLabel('Secondary phone number').fill('+212612345678');
    await page
      .locator('#avatar')
      .setInputFiles({
        name: 'acceptance-photo.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
          'base64',
        ),
      });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/teachers$/);
    const staff = (
      await (
        await request.get(api + '/teachers/' + teacher.id, { headers })
      ).json()
    ).data;
    expect(staff.user.firstNameEn).toBe('English teacher');
    expect(staff.user.secondaryPhoneNumber).toBe('+212612345678');
    created.unshift({ path: '/media', id: staff.user.avatarId });
    await page.goto('/edit-teacher/' + teacher.id);
    await expect(page.locator('.profile-photo')).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator('.profile-photo')
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    const student = await create('/admin/students', {
      firstName: 'Browser',
      lastName: 'Student' + stamp,
      email: `student${stamp}@example.test`,
      username: 'student' + stamp,
      password: 'Browser-test-only-42',
      locale: 'en',
      gender: 'M',
      birthDate: '2000-01-01',
    });
    const mobileLogin = await request.post(api + '/auth/login', {
      data: {
        identifier: 'student' + stamp,
        password: 'Browser-test-only-42',
        client: 'mobile',
      },
    });
    expect(mobileLogin.ok()).toBeTruthy();
    const mobileHeaders = {
      authorization: 'Bearer ' + (await mobileLogin.json()).data.accessToken,
    };
    const enrollment = await request.post(api + '/enrollments', {
      headers: mobileHeaders,
      data: { studentId: student.id, groupId },
    });
    expect(enrollment.status(), await enrollment.text()).toBe(201);
    const mobileGroups = (
      await (
        await request.get(api + '/groups', { headers: mobileHeaders })
      ).json()
    ).data;
    expect(mobileGroups.some((g: any) => g.id === groupId)).toBe(true);
    await page.goto('/students');
    await page.getByLabel('Search', { exact: true }).fill('Student' + stamp);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(
      page.getByRole('cell', { name: 'UI program ' + stamp, exact: true }),
    ).toBeVisible();
    const catalog = (
      await (await request.get(api + '/groups/catalog/' + groupId)).json()
    ).data;
    expect(catalog.leftPlaces).toBe(group.maxStudentsCount - 1);
    expect(
      (
        await request.delete(api + '/admin/students/' + student.id, { headers })
      ).status(),
    ).toBe(409);
    // Remove only this disposable membership so the existing deletion UI scenario can run.
    await db.groupStudent.deleteMany({
      where: { studentId: student.id, groupId },
    });
    await page.goto('/edit-student/' + student.id);
    await page
      .getByLabel('Phone number', { exact: true })
      .fill('+212611223344');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/students$/);
    await page.goto('/edit-student/' + student.id);
    await page.getByLabel('Phone number', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/students$/);
    const studentProfile = (
      await (
        await request.get(api + '/students/' + student.id, { headers })
      ).json()
    ).data;
    expect(studentProfile.user.phoneNumber).toBeNull();
    await page.getByLabel('Search', { exact: true }).fill('Student' + stamp);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByLabel('Select row', { exact: true }).check();
    await page
      .getByLabel('Change status', { exact: true })
      .selectOption('INACTIVE');
    await expect(
      page.getByText('Saved successfully', { exact: true }),
    ).toBeVisible();
    const updatedStudent = (
      await (
        await request.get(api + '/students/' + student.id, { headers })
      ).json()
    ).data;
    expect(updatedStudent.user.status).toBe('INACTIVE');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
    expect((await download).suggestedFilename()).toContain('students');
    await page.getByLabel('Select row', { exact: true }).check();
    await page
      .locator('.toolbar')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await expect(page.getByText('No records found')).toBeVisible();
    created.splice(
      created.findIndex((r) => r.id === student.id),
      1,
    );
    await page.goto('/students');
    await page.getByText('Filters', { exact: true }).click();
    await page.getByLabel('Academic number', { exact: true }).fill('999999');
    await expect(page.getByText('No records found')).toBeVisible();
    await page.getByLabel('Language / اللغة').selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.screenshot({
      path: 'test-results/real-arabic-students.png',
      fullPage: true,
    });
    await page.locator('.logout').click();
    await expect(page).toHaveURL(/login/);
    await page.goto('/groups');
    await expect(page).toHaveURL(/login/);
  } finally {
    for (const row of created.filter((r) => r.path === '/admin/students')) {
      await db.groupStudent.deleteMany({ where: { studentId: row.id } });
    }
    for (const row of created) {
      const r = await request.delete(api + row.path + '/' + row.id, {
        headers,
      });
      if (row.path === '/media' && r.ok())
        await db.mediaFile.deleteMany({
          where: { id: row.id, deletedAt: { not: null } },
        });
      expect(r.ok(), `Cleanup ${row.path}: ${r.status()}`).toBeTruthy();
    }
    await db.$disconnect();
  }
});
