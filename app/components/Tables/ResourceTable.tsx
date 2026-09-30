import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { FiMoreVertical } from 'react-icons/fi';
import dayjs from 'dayjs';
import { useLanguage, useTranslations } from '@/i18n';
import { resources, type ResourceKey } from '@/constants/resources';
import {
  localized,
  recordId,
  activeMemberships,
  distinctPrograms,
} from '@/utils';
import DisplayDropdown from '@/components/Dropdown/DisplayDropdown';
import Button from '@/components/Buttons/Button';
import type { RecordData } from '@/types';
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
  onDelete: _onDelete,
  onEndGroup,
}: {
  resource: ResourceKey;
  rows: RecordData[];
  selection: RowSelectionState;
  setSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onDelete: (ids: string[]) => void;
  onEndGroup?: (group: RecordData) => void;
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
            disabled={!!row.original.endedAt}
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
                to={
                  resource === 'groups'
                    ? row.original.endedAt
                      ? `/groups/${recordId(row.original)}`
                      : `/edit-group/${recordId(row.original)}`
                    : resource === 'students'
                      ? `/students/${recordId(row.original)}`
                      : `/edit-${config.singular}/${recordId(row.original)}`
                }
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
        cell: ({ row }) =>
          resource === 'groups' ? (
            <GroupActions group={row.original} onEndGroup={onEndGroup} />
          ) : (
            <div className='actions'>
              <Link
                className='button button-outline'
                to={
                  resource === 'students'
                    ? `/${resource}/${recordId(row.original)}`
                    : `/edit-${config.singular}/${recordId(row.original)}`
                }
              >
                {t(resource === 'students' ? 'view' : 'edit')}
              </Link>
            </div>
          ),
      },
    ],
    [config, locale, onEndGroup, resource, t],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: recordId,
    enableRowSelection: (row) => !row.original.endedAt,
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

function GroupActions({
  group,
  onEndGroup,
}: {
  group: RecordData;
  onEndGroup?: (group: RecordData) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(
      Math.max(8, rect.right - 170),
      Math.max(8, window.innerWidth - 178),
    );
    const roomBelow = window.innerHeight - rect.bottom;
    setPosition(
      roomBelow >= 220 || roomBelow >= rect.top
        ? { top: rect.bottom + 4, left }
        : { bottom: window.innerHeight - rect.top + 4, left },
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    place();
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  const id = recordId(group);
  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        className='action-menu-trigger'
        aria-label={t('actions')}
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => {
          if (open) setOpen(false);
          else {
            place();
            setOpen(true);
          }
        }}
      >
        <FiMoreVertical aria-hidden='true' focusable='false' />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role='menu'
            className='action-menu-items'
            style={position}
            onClick={() => setOpen(false)}
          >
            <Link
              role='menuitem'
              to={group.endedAt ? `/groups/${id}` : `/edit-group/${id}`}
            >
              {t(group.endedAt ? 'view' : 'edit')}
            </Link>
            <Link role='menuitem' to={`/groups/${id}/messages`}>
              {t('messages')}
            </Link>
            {!group.endedAt && (
              <Button
                role='menuitem'
                variant='ghost'
                className='destructive-text'
                onClick={() => onEndGroup?.(group)}
              >
                {t('endGroup')}
              </Button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
