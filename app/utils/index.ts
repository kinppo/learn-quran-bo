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
