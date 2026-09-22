import { useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useLanguage, useTranslations } from '@/i18n';
import { resources, type ResourceKey } from '@/constants/resources';
import {
  localized,
  recordId,
  activeMemberships,
  sortByRecentProgram,
  distinctPrograms,
} from '@/utils';
import DisplayDropdown from '@/components/Dropdown/DisplayDropdown';
import type { RecordData } from '@/types';
import Button from '@/components/Buttons/Button';
export function cellValue(
  row: RecordData,
  key: string,
  locale: 'ar' | 'en',
): string | number {
  const user = row.user || row;
  if (key === 'name')
    return row.user
      ? `${locale === 'en' ? user.firstNameEn || user.firstName : user.firstName} ${locale === 'en' ? user.lastNameEn || user.lastName : user.lastName}`
      : localized(row, locale);
  if (key === 'description') return localized(row, locale, 'description');
  if (key === 'programId')
    return row.memberships
      ? distinctPrograms(activeMemberships(row.memberships))
          .map((p: RecordData) => localized(p, locale))
          .join(' / ') || localized(row.program, locale)
      : localized(row.program, locale);
  if (key === 'riwayaId') return localized(row.riwaya, locale);
  if (key === 'occupied') return row._count?.students ?? 0;
  if (key === 'createdAt') return dayjs(user.createdAt).format('YYYY-MM-DD');
  if (['email', 'phoneNumber', 'status'].includes(key)) return user[key] || '—';
  return row[key] ?? '—';
}
export default function ResourceTable({
  resource,
  rows,
  selection,
  setSelection,
  onDelete,
}: {
  resource: ResourceKey;
  rows: RecordData[];
  selection: RowSelectionState;
  setSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onDelete: (ids: string[]) => void;
}) {
  const { locale } = useLanguage();
  const t = useTranslations();
  const config = resources[resource];
  const columns = useMemo<ColumnDef<RecordData>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type='checkbox'
            aria-label={t('selectAll')}
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type='checkbox'
            aria-label={t('selectRow')}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      ...config.columns.map((key) => ({
        id: key,
        header: t(key),
        cell: ({ row }: { row: { original: RecordData } }) => {
          const value = cellValue(row.original, key, locale);
          if (key === 'status' || key === 'active')
            return (
              <span className={`badge ${String(value)}`}>
                {key === 'active'
                  ? t(value ? 'ACTIVE' : 'INACTIVE')
                  : t(String(value))}
              </span>
            );
          if (key === 'languageCode') return t(String(value));
          if (key === 'gender') return t(String(value));
          if (key === 'name')
            return (
              <Link
                className='row-link'
                to={`/edit-${config.singular}/${recordId(row.original)}`}
              >
                {String(value)}
              </Link>
            );
          if (key === 'programId' && row.original.memberships) {
            const programs = distinctPrograms(
              activeMemberships(row.original.memberships),
            );
            if (programs.length > 1)
              return (
                <DisplayDropdown
                  label={t('viewPrograms')}
                  items={programs.map((p: RecordData) => localized(p, locale))}
                />
              );
          }
          return String(value);
        },
      })),
      {
        id: 'actions',
        header: t('actions'),
        cell: ({ row }) => (
          <div className='actions'>
            <Link
              className='button button-outline'
              to={`/edit-${config.singular}/${recordId(row.original)}`}
            >
              {t('edit')}
            </Link>
            <Button
              variant='ghost'
              onClick={() => onDelete([recordId(row.original)])}
            >
              {t('delete')}
            </Button>
          </div>
        ),
      },
    ],
    [config, locale, t, onDelete],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: recordId,
    state: { rowSelection: selection },
    onRowSelectionChange: setSelection,
  });
  return (
    <div className='table-wrap'>
      <table>
        <thead>
          {table.getHeaderGroups().map((g) => (
            <tr key={g.id}>
              {g.headers.map((h) => (
                <th key={h.id}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id}>
              {r.getVisibleCells().map((c) => (
                <td key={c.id}>
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className='empty'>{t('empty')}</p>}
    </div>
  );
}
