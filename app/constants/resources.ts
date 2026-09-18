import { z } from 'zod';
import type { RecordData } from '@/types';
export type ResourceKey =
  'students' | 'teachers' | 'groups' | 'programs' | 'categories' | 'riwayat';
export interface Field {
  name: string;
  type?: string;
  required?: boolean;
  source?: string;
  values?: string[];
  multiple?: boolean;
  min?: number;
  max?: number;
  createOnly?: boolean;
}
export interface Resource {
  singular: string;
  route: string;
  writeRoute?: string;
  fields: Field[];
  columns: string[];
  defaults: RecordData;
  schema: (edit: boolean) => z.ZodTypeAny;
}
const name = z.string().trim().min(1).max(200);
const text = z.string().max(5000).optional();
const uuid = z.string().uuid();
const optionalId = z.union([uuid, z.literal('')]).optional();
const names = { nameAr: name, nameEn: name };
const namesFields: Field[] = [
  { name: 'nameAr', required: true },
  { name: 'nameEn', required: true },
];
const descriptions: Field[] = [
  { name: 'descriptionAr', type: 'textarea' },
  { name: 'descriptionEn', type: 'textarea' },
];
const profileFields: Field[] = [
  { name: 'firstNameEn' },
  { name: 'lastNameEn' },
  { name: 'secondaryPhoneNumber', type: 'tel' },
  { name: 'nationalIdentityNumber' },
  { name: 'firstName', required: true },
  { name: 'lastName', required: true },
  { name: 'email', type: 'email', required: true },
  { name: 'username', required: true },
  { name: 'password', type: 'password', createOnly: true, required: true },
  { name: 'gender', values: ['M', 'F'] },
  { name: 'birthDate', type: 'date' },
  { name: 'countryId', source: 'countries' },
  { name: 'phoneNumber', type: 'tel' },
  { name: 'locale', values: ['ar', 'en'] },
  { name: 'status', values: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'WAITING'] },
];
const profileSchema = (edit: boolean) =>
  z.object({
    firstNameEn: z.string().max(100).optional(),
    lastNameEn: z.string().max(100).optional(),
    secondaryPhoneNumber: z
      .union([z.string().regex(/^\+?[0-9 ()-]{6,25}$/), z.literal('')])
      .optional(),
    nationalIdentityNumber: z.string().max(100).optional(),
    firstName: name,
    lastName: name,
    email: z.string().email(),
    username: z.string().regex(/^(?=.*[a-zA-Z])[a-zA-Z0-9]{3,50}$/),
    ...(!edit ? { password: z.string().min(8).max(72) } : {}),
    gender: z.enum(['M', 'F']).optional(),
    birthDate: z.string().optional(),
    countryId: optionalId,
    phoneNumber: z
      .union([z.string().regex(/^\+?[0-9 ()-]{6,25}$/), z.literal('')])
      .optional(),
    locale: z.enum(['ar', 'en']),
    ...(edit
      ? { status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED', 'WAITING']) }
      : {}),
  });
const personDefaults = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  locale: 'ar',
  status: 'ACTIVE',
  gender: 'M',
  birthDate: '',
  countryId: '',
  phoneNumber: '',
};
export const resources: Record<ResourceKey, Resource> = {
  categories: {
    singular: 'category',
    route: '/categories',
    fields: [
      ...namesFields,
      { name: 'minAge', type: 'number', required: true, min: 0, max: 120 },
      { name: 'maxAge', type: 'number', required: true, min: 0, max: 120 },
      { name: 'gender', values: ['M', 'F', 'ALL'], required: true },
    ],
    columns: ['name', 'minAge', 'maxAge', 'gender'],
    defaults: { nameAr: '', nameEn: '', minAge: 0, maxAge: 120, gender: 'ALL' },
    schema: () =>
      z
        .object({
          ...names,
          minAge: z.coerce.number().int().min(0).max(120),
          maxAge: z.coerce.number().int().min(0).max(120),
          gender: z.enum(['M', 'F', 'ALL']),
        })
        .refine((v) => v.maxAge >= v.minAge, { path: ['maxAge'] }),
  },
  riwayat: {
    singular: 'riwaya',
    route: '/riwayat',
    fields: [...namesFields, ...descriptions],
    columns: ['name', 'description'],
    defaults: { nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '' },
    schema: () =>
      z.object({ ...names, descriptionAr: text, descriptionEn: text }),
  },
  programs: {
    singular: 'program',
    route: '/programs',
    fields: [
      ...namesFields,
      ...descriptions,
      { name: 'termsAr', type: 'textarea' },
      { name: 'termsEn', type: 'textarea' },
      { name: 'cadence' },
      { name: 'revisionCadence' },
      {
        name: 'memorizationDenominator',
        values: ['1', '2', '4', '8'],
        required: true,
      },
      {
        name: 'revisionDenominator',
        values: ['1', '2', '4', '8'],
        required: true,
      },
      {
        name: 'weeklySessionsCount',
        type: 'number',
        min: 1,
        max: 14,
        required: true,
      },
      { name: 'durationMonths', type: 'number', min: 1, max: 1200 },
      {
        name: 'categoryIds',
        source: 'categories',
        multiple: true,
        required: true,
      },
      { name: 'note', type: 'textarea' },
    ],
    columns: ['name', 'weeklySessionsCount', 'durationMonths', 'occupied'],
    defaults: {
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      termsAr: '',
      termsEn: '',
      cadence: '',
      revisionCadence: '',
      note: '',
      memorizationDenominator: 8,
      revisionDenominator: 1,
      weeklySessionsCount: 1,
      durationMonths: '',
      categoryIds: [],
    },
    schema: () =>
      z.object({
        ...names,
        descriptionAr: text,
        descriptionEn: text,
        termsAr: text,
        termsEn: text,
        cadence: z.string().max(200).optional(),
        revisionCadence: z.string().max(200).optional(),
        note: text,
        memorizationDenominator: z.coerce
          .number()
          .refine((n) => [1, 2, 4, 8].includes(n)),
        revisionDenominator: z.coerce
          .number()
          .refine((n) => [1, 2, 4, 8].includes(n)),
        weeklySessionsCount: z.coerce.number().int().min(1).max(14),
        durationMonths: z
          .union([z.literal(''), z.coerce.number().int().min(1).max(1200)])
          .optional(),
        categoryIds: z.array(uuid).min(1),
      }),
  },
  teachers: {
    singular: 'teacher',
    route: '/teachers',
    fields: [
      ...profileFields,
      { name: 'registrationNumber' },
      { name: 'languageCodes', values: ['ar', 'en'], multiple: true },
      { name: 'riwayaIds', source: 'riwayat', multiple: true },
      { name: 'description', type: 'textarea' },
    ],
    columns: ['name', 'email', 'phoneNumber', 'status'],
    defaults: {
      ...personDefaults,
      registrationNumber: '',
      languageCodes: ['ar'],
      riwayaIds: [],
      description: '',
    },
    schema: (edit) =>
      profileSchema(edit).extend({
        registrationNumber: z.string().max(100).optional(),
        languageCodes: z.array(z.enum(['ar', 'en'])),
        riwayaIds: z.array(uuid),
        description: text,
      }),
  },
  students: {
    singular: 'student',
    route: '/students',
    writeRoute: '/admin/students',
    fields: [
      ...profileFields.filter(
        (f) =>
          !f.createOnly &&
          ![
            'firstNameEn',
            'lastNameEn',
            'secondaryPhoneNumber',
            'nationalIdentityNumber',
          ].includes(f.name),
      ),
      { name: 'professionId', source: 'professions' },
      { name: 'professionOther' },
      { name: 'studyLevelId', source: 'study-levels' },
    ],
    columns: [
      'academicNumber',
      'name',
      'email',
      'programId',
      'status',
      'createdAt',
    ],
    defaults: personDefaults,
    schema: () =>
      profileSchema(true)
        .omit({
          firstNameEn: true,
          lastNameEn: true,
          secondaryPhoneNumber: true,
          nationalIdentityNumber: true,
        })
        .extend({
          professionId: optionalId,
          professionOther: z.string().max(100).optional(),
          studyLevelId: optionalId,
        }),
  },
  groups: {
    singular: 'group',
    route: '/groups',
    fields: [
      ...namesFields,
      {
        name: 'maxStudentsCount',
        type: 'number',
        min: 1,
        max: 1000,
        required: true,
      },
      { name: 'programId', source: 'programs', required: true },
      { name: 'riwayaId', source: 'riwayat', required: true },
      { name: 'languageCode', values: ['ar', 'en'], required: true },
      {
        name: 'teacherIds',
        source: 'teachers',
        multiple: true,
        required: true,
      },
      { name: 'auditorIds', source: 'auditors', multiple: true },
      { name: 'meetingId' },
      { name: 'meetingPasscode' },
      { name: 'meetingUrl', type: 'url' },
      { name: 'timeZone', required: true },
      { name: 'active', type: 'checkbox' },
    ],
    columns: [
      'name',
      'programId',
      'riwayaId',
      'languageCode',
      'maxStudentsCount',
      'leftPlaces',
      'active',
    ],
    defaults: {
      nameAr: '',
      nameEn: '',
      maxStudentsCount: 20,
      programId: '',
      riwayaId: '',
      languageCode: 'ar',
      teacherIds: [],
      auditorIds: [],
      meetingId: '',
      meetingPasscode: '',
      meetingUrl: '',
      timeZone: 'Africa/Casablanca',
      active: true,
      planning: [
        {
          day: 1,
          startTime: '08:00',
          endTime: '09:00',
          kind: 'HIFD',
          absenceTracking: true,
        },
      ],
    },
    schema: () =>
      z
        .object({
          ...names,
          maxStudentsCount: z.coerce.number().int().min(1).max(1000),
          programId: uuid,
          riwayaId: uuid,
          languageCode: z.enum(['ar', 'en']),
          teacherIds: z.array(uuid).min(1),
          auditorIds: z.array(uuid),
          meetingId: z.string().max(200),
          meetingPasscode: z.string().max(200),
          meetingUrl: z.union([
            z.literal(''),
            z.string().url().startsWith('https://'),
          ]),
          timeZone: z.string().refine((v) => {
            try {
              new Intl.DateTimeFormat('en', { timeZone: v });
              return true;
            } catch {
              return false;
            }
          }),
          active: z.boolean(),
          planning: z
            .array(
              z
                .object({
                  id: uuid.optional(),
                  day: z.coerce.number().int().min(1).max(7),
                  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
                  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
                  kind: z.enum(['HIFD', 'TAJWID']),
                  absenceTracking: z.boolean().optional(),
                })
                .refine((v) => v.startTime < v.endTime, { path: ['endTime'] }),
            )
            .min(1)
            .max(28),
        })
        .refine(
          (v) =>
            !v.planning.some((slot, i) =>
              v.planning.some(
                (other, j) =>
                  i !== j &&
                  slot.day === other.day &&
                  slot.startTime < other.endTime &&
                  slot.endTime > other.startTime,
              ),
            ),
          { path: ['planning'] },
        ),
  },
};
export function formValues(key: ResourceKey, row: RecordData) {
  const base = { ...resources[key].defaults, ...row, ...row.user };
  for (const field of resources[key].fields) {
    if (base[field.name] == null)
      base[field.name] =
        resources[key].defaults[field.name] ?? (field.multiple ? [] : '');
  }
  if (row.user?.birthDate) base.birthDate = row.user.birthDate.slice(0, 10);
  if (key === 'programs')
    base.categoryIds = row.categories.map((c: RecordData) => c.categoryId);
  if (key === 'teachers')
    base.riwayaIds = row.riwayat.map((r: RecordData) => r.riwayaId);
  if (key === 'groups') {
    base.teacherIds = row.teachers.map((r: RecordData) => r.teacherId);
    base.auditorIds = row.auditors.map((r: RecordData) => r.auditorId);
    base.planning = row.planning.map((p: RecordData) => ({
      id: p.id,
      day: p.day,
      startTime: p.startTime,
      endTime: p.endTime,
      kind: p.kind,
      absenceTracking: p.absenceTracking,
    }));
  }
  return base;
}
export function payload(key: ResourceKey, values: RecordData, edit: boolean) {
  const parsed = resources[key].schema(edit).parse(values);
  return Object.fromEntries(
    Object.entries(parsed).flatMap(([k, v]) => {
      if (v === undefined) return [];
      if (
        v === '' &&
        (k.endsWith('Id') ||
          [
            'birthDate',
            'phoneNumber',
            'secondaryPhoneNumber',
            'meetingUrl',
            'durationMonths',
          ].includes(k))
      ) {
        return edit ? [[k, null]] : [];
      }
      return [[k, v]];
    }),
  );
}
