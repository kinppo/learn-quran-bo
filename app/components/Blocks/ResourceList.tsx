import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage, useTranslations } from '@/i18n';
import { resources, type ResourceKey } from '@/constants/resources';
import { useRequest } from '@/hooks/useRequest';
import { allRecords, DELETE, GET, PATCH } from '@/lib/crud';
import { downloadCsv, localized, recordId } from '@/utils';
import { errorKey } from '@/utils/errors';
import type { RecordData } from '@/types';
import ResourceTable, { cellValue } from '@/components/Tables/ResourceTable';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';
import Confirm from '@/components/Popup/Confirm';
export default function ResourceList({ resource }: { resource: ResourceKey }) {
  const t = useTranslations();
  const { locale } = useLanguage();
  const config = resources[resource];
  const [params, setParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [filterOptions, setFilterOptions] = useState<
    Record<string, RecordData[]>
  >({});
  const [search, setSearch] = useState(params.get('search') || '');
  const page = Math.max(1, Number(params.get('page')) || 1);
  const query = new URLSearchParams(params);
  query.set('limit', '6');
  query.set('page', String(page));
  const { response, error, loading } = useRequest<RecordData[]>(
    `${config.route}?${query}`,
    revision,
  );
  const rows = response?.data || [];
  const count = response?.count || 0;
  const selected = Object.keys(selection).filter((id) => selection[id]);
  useEffect(() => {
    setSelection({});
    setSearch(params.get('search') || '');
  }, [params]);
  useEffect(() => {
    let active = true;
    if (resource === 'students' || resource === 'groups')
      Promise.all(
        ['programs', 'groups', 'riwayat'].map(
          async (key) => [key, await allRecords('/' + key)] as const,
        ),
      )
        .then((entries) => {
          if (active) setFilterOptions(Object.fromEntries(entries));
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [resource]);
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };
  const remove = useCallback((ids: string[]) => setDeleting(ids), []);
  async function bulkStatus(status: string) {
    setBusy(true);
    setNotice('');
    const results = await Promise.allSettled(
      selected.map((id) => PATCH(`/admin/students/${id}`, { status })),
    );
    setNotice(
      results.some((r) => r.status === 'rejected') ? 'partialFailure' : 'saved',
    );
    setBusy(false);
    setSelection({});
    setRevision((n) => n + 1);
  }
  async function exportRows() {
    setBusy(true);
    setNotice('');
    try {
      let output = rows.filter((r) => selection[recordId(r)]);
      if (!selected.length) {
        output = [];
        for (let p = 1; ; p++) {
          const q = new URLSearchParams(params);
          q.set('page', String(p));
          q.set('limit', '100');
          const r = await GET<RecordData[]>(`${config.route}?${q}`);
          output.push(...r.data);
          if (output.length >= (r.count || 0) || !r.data.length) break;
        }
      }
      downloadCsv(resource, [
        config.columns.map((c) => t(c)),
        ...output.map((row) =>
          config.columns.map((key) => cellValue(row, key, locale)),
        ),
      ]);
    } catch (e) {
      setNotice(errorKey(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className='page-title'>
        <h1>{t(resource)}</h1>
        {resource !== 'students' && (
          <Link
            className='button button-primary'
            to={`/add-${config.singular}`}
          >
            + {t('add')} {t(config.singular)}
          </Link>
        )}
      </div>
      <section className='card'>
        <form
          className='toolbar'
          onSubmit={(e) => {
            e.preventDefault();
            change('search', search);
          }}
        >
          <input
            className='search'
            aria-label={t('search')}
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type='submit' variant='outline'>
            {t('search')}
          </Button>
          <Button
            variant='outline'
            isLoading={busy}
            onClick={() => void exportRows()}
          >
            {t('export')}
          </Button>
          {!!selected.length && (
            <>
              <span>
                {t('selected')}: {selected.length}
              </span>
              <Button
                variant='destructive'
                disabled={busy}
                onClick={() => setDeleting(selected)}
              >
                {t('delete')}
              </Button>
              {resource === 'students' && (
                <select
                  aria-label={t('statusChange')}
                  value=''
                  disabled={busy}
                  onChange={(e) => void bulkStatus(e.target.value)}
                >
                  <option value=''>{t('statusChange')}</option>
                  {['ACTIVE', 'INACTIVE', 'BLOCKED', 'WAITING'].map((s) => (
                    <option key={s} value={s}>
                      {t(s)}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </form>
        {(resource === 'students' || resource === 'groups') && (
          <details>
            <summary>{t('filters')}</summary>
            <div className='filters'>
              {resource === 'students' && (
                <>
                  {['academicNumber', 'firstName', 'lastName', 'username'].map(
                    (key) => (
                      <label key={key}>
                        {t(key)}
                        <input
                          value={params.get(key) || ''}
                          type={key === 'academicNumber' ? 'number' : 'text'}
                          onChange={(e) => change(key, e.target.value)}
                        />
                      </label>
                    ),
                  )}
                  <label>
                    {t('status')}
                    <select
                      value={params.get('status') || ''}
                      onChange={(e) => change('status', e.target.value)}
                    >
                      <option value=''>{t('all')}</option>
                      {['ACTIVE', 'INACTIVE', 'BLOCKED', 'WAITING'].map((s) => (
                        <option key={s} value={s}>
                          {t(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {['from', 'to'].map((key) => (
                    <label key={key}>
                      {t(key)}
                      <input
                        type='date'
                        value={params.get(key)?.slice(0, 10) || ''}
                        onChange={(e) =>
                          change(
                            key,
                            e.target.value
                              ? e.target.value +
                                  (key === 'to'
                                    ? 'T23:59:59.999Z'
                                    : 'T00:00:00.000Z')
                              : '',
                          )
                        }
                      />
                    </label>
                  ))}
                </>
              )}
              {(resource === 'students'
                ? ['programId', 'groupId']
                : ['programId', 'riwayaId']
              ).map((key) => (
                <label key={key}>
                  {t(key)}
                  <select
                    value={params.get(key) || ''}
                    onChange={(e) => change(key, e.target.value)}
                  >
                    <option value=''>{t('all')}</option>
                    {(
                      filterOptions[
                        key === 'programId'
                          ? 'programs'
                          : key === 'groupId'
                            ? 'groups'
                            : 'riwayat'
                      ] || []
                    ).map((row) => (
                      <option key={row.id} value={row.id}>
                        {localized(row, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              {resource === 'groups' && (
                <label>
                  {t('languageCode')}
                  <select
                    value={params.get('languageCode') || ''}
                    onChange={(e) => change('languageCode', e.target.value)}
                  >
                    <option value=''>{t('all')}</option>
                    <option value='ar'>{t('ar')}</option>
                    <option value='en'>{t('en')}</option>
                  </select>
                </label>
              )}
              <Button variant='outline' onClick={() => setParams({})}>
                {t('reset')}
              </Button>
            </div>
          </details>
        )}
        <div className='toolbar'>
          <label>
            {t('order')}{' '}
            <select
              aria-label={t('order')}
              value={params.get('order') || 'desc'}
              onChange={(e) => change('order', e.target.value)}
            >
              <option value='desc'>{t('desc')}</option>
              <option value='asc'>{t('asc')}</option>
            </select>
          </label>
        </div>
        {notice && (
          <p role='status' className={notice === 'saved' ? 'success' : 'error'}>
            {t(notice)}
          </p>
        )}
        {error ? (
          <div role='alert'>
            <p className='error'>{t(errorKey(error))}</p>
            <Button onClick={() => setRevision((n) => n + 1)}>
              {t('retry')}
            </Button>
          </div>
        ) : loading ? (
          <Loading />
        ) : (
          <ResourceTable
            resource={resource}
            rows={rows}
            selection={selection}
            setSelection={setSelection}
            onDelete={remove}
          />
        )}
        <div className='pagination'>
          <span>
            {t('total')}: {count}
          </span>
          <div className='actions'>
            <Button
              variant='outline'
              disabled={page <= 1 || loading}
              onClick={() => {
                const n = new URLSearchParams(params);
                n.set('page', String(page - 1));
                setParams(n);
              }}
            >
              {t('previous')}
            </Button>
            <span>
              {t('page')} {page} / {Math.max(1, Math.ceil(count / 6))}
            </span>
            <Button
              variant='outline'
              disabled={page * 6 >= count || loading}
              onClick={() => {
                const n = new URLSearchParams(params);
                n.set('page', String(page + 1));
                setParams(n);
              }}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      </section>
      {!!deleting.length && (
        <Confirm
          busy={busy}
          onClose={() => setDeleting([])}
          onConfirm={() => {
            setBusy(true);
            void Promise.allSettled(
              deleting.map((id) =>
                DELETE(`${config.writeRoute || config.route}/${id}`),
              ),
            )
              .then((results) => {
                setNotice(
                  results.some((r) => r.status === 'rejected')
                    ? 'partialFailure'
                    : 'deleted',
                );
                setDeleting([]);
                setSelection({});
                setRevision((n) => n + 1);
              })
              .finally(() => setBusy(false));
          }}
        />
      )}
    </>
  );
}
