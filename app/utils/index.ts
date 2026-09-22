import { twMerge } from 'tailwind-merge';
import type { Locale, RecordData } from '@/types';
export const cn = (...values: (string | undefined | false)[]) =>
  twMerge(values.filter(Boolean).join(' '));
export const localized = (
  row: RecordData | undefined,
  locale: Locale,
  field = 'name',
): string =>
  row?.[field + (locale === 'ar' ? 'Ar' : 'En')] || row?.[field + 'Ar'] || '—';
export const recordId = (row: RecordData) => row.id || row.userId;
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function downloadCsv(name: string, rows: unknown[][]) {
  const url = URL.createObjectURL(
    new Blob(
      ['\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')],
      { type: 'text/csv;charset=utf-8;' },
    ),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}
export const activeMemberships = (
  memberships: RecordData[] = [],
): RecordData[] => memberships.filter((m) => m.active);
export function sortByRecentProgram(memberships: RecordData[]): RecordData[] {
  return [...memberships].sort((a, b) => {
    const ap = a.group?.program?.createdAt;
    const bp = b.group?.program?.createdAt;
    if (ap && bp) return new Date(bp).getTime() - new Date(ap).getTime();
    if (ap) return -1;
    if (bp) return 1;
    return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
  });
}
export function distinctPrograms(memberships: RecordData[]): RecordData[] {
  return Array.from(
    new Map(
      memberships
        .filter((m) => m.group?.program)
        .map((m) => [m.group.program.id, m.group.program]),
    ).values(),
  );
}
