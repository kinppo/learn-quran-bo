import { resources, payload, formValues } from '@/constants/resources';
import { csvCell } from '@/utils';
import { messages } from '@/i18n/messages';
const id = '12345678-1234-4234-8234-123456789abc';
test('rejects overlapping and reversed group sessions', () => {
  const group: Record<string, any> = {
    ...resources.groups.defaults,
    nameAr: 'حلقة',
    nameEn: 'Group',
    programId: id,
    riwayaId: id,
    teacherIds: [id],
  };
  expect(resources.groups.schema(false).safeParse(group).success).toBe(true);
  expect(
    resources.groups
      .schema(false)
      .safeParse({ ...group, planning: [...group.planning, ...group.planning] })
      .success,
  ).toBe(false);
  expect(
    resources.groups.schema(false).safeParse({
      ...group,
      planning: [{ ...group.planning[0], endTime: '07:00' }],
    }).success,
  ).toBe(false);
});
test('sends only editable fields and preserves planning IDs', () => {
  const values = formValues('groups', {
    ...resources.groups.defaults,
    id,
    teachers: [{ teacherId: id }],
    auditors: [],
    nameAr: 'حلقة',
    nameEn: 'Group',
    programId: id,
    riwayaId: id,
    planning: [
      { id, day: 1, startTime: '09:00', endTime: '10:00', kind: 'HIFD' },
    ],
  });
  const data: Record<string, any> = payload('groups', values, true);
  expect(data.id).toBeUndefined();
  expect(data.planning[0].id).toBe(id);
  expect(data.meetingUrl).toBeNull();
});
test('blocks invalid age bounds and zero cadence', () => {
  expect(
    resources.categories.schema(false).safeParse({
      nameAr: 'فئة',
      nameEn: 'Category',
      minAge: 20,
      maxAge: 10,
      gender: 'ALL',
    }).success,
  ).toBe(false);
  expect(
    resources.programs.schema(false).safeParse({
      ...resources.programs.defaults,
      nameAr: 'برنامج',
      nameEn: 'Program',
      categoryIds: [id],
      memorizationDenominator: 0,
    }).success,
  ).toBe(false);
});
test('validates auditor create and edit forms', () => {
  const auditor = {
    ...resources.auditors.defaults,
    firstName: 'Audit',
    lastName: 'User',
    email: 'auditor@example.com',
    username: 'auditor1',
    password: 'password123',
  };
  expect(resources.auditors.schema(false).safeParse(auditor).success).toBe(
    true,
  );
  expect(
    resources.auditors.schema(false).safeParse({ ...auditor, password: '' })
      .success,
  ).toBe(false);
  expect(
    resources.auditors.schema(true).safeParse({ ...auditor, password: '' })
      .success,
  ).toBe(true);
});
test('CSV quotes delimiters and neutralizes formula injection', () => {
  expect(csvCell('=1+1')).toBe('"\'=1+1"');
  expect(csvCell('a,"b"')).toBe('"a,""b"""');
});
test('Arabic and English cover identical UI messages', () => {
  expect(Object.keys(messages.ar).sort()).toEqual(
    Object.keys(messages.en).sort(),
  );
});
