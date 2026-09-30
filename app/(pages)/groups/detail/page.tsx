import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage, useTranslations } from '@/i18n';
import { useRequest } from '@/hooks/useRequest';
import { localized } from '@/utils';
import type { RecordData } from '@/types';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';
const percentage = (n: number, d: number) =>
  d ? `${((100 * n) / d).toFixed(1)}%` : '0%';
export default function GroupDetail() {
  const { id } = useParams();
  const { locale } = useLanguage();
  const t = useTranslations();
  const [revision, refresh] = useState(0);
  const group = useRequest<RecordData>(`/groups/${id}`, revision);
  if (group.loading) return <Loading />;
  if (group.error || !group.response)
    return (
      <>
        <p role='alert'>{t('resultsFailed')}</p>
        <Button onClick={() => refresh((n) => n + 1)}>{t('retry')}</Button>
      </>
    );
  const row = group.response.data;
  return (
    <section className='card'>
      <h1>{localized(row, locale)}</h1>
      <p>{localized(row.program, locale)}</p>
      {row.endedAt ? (
        <>
          <p>
            {t('ended')} · {row.endedAt.slice(0, 10)}
          </p>
          <Results id={id!} criteria={row} />
        </>
      ) : (
        <Link className='button button-outline' to={`/edit-group/${id}`}>
          {t('edit')}
        </Link>
      )}
    </section>
  );
}
function Results({ id, criteria }: { id: string; criteria: RecordData }) {
  const t = useTranslations();
  const [page, setPage] = useState(1);
  const [revision, refresh] = useState(0);
  const { response, loading, error } = useRequest<RecordData[]>(
    `/groups/${id}/results?page=${page}&limit=20`,
    revision,
  );
  if (loading) return <Loading />;
  if (error)
    return (
      <>
        <p role='alert'>{t('resultsFailed')}</p>
        <Button onClick={() => refresh((n) => n + 1)}>{t('retry')}</Button>
      </>
    );
  return (
    <section>
      <h2>{t('completionResults')}</h2>
      <p>
        {t('minAttendancePercent')}: {criteria.minAttendancePercent}% ·{' '}
        {t('minSatisfactoryPercent')}: {criteria.minSatisfactoryPercent}%
      </p>
      <div className='table-wrap'>
        <table>
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('status')}</th>
              <th>{t('attendanceResult')}</th>
              <th>{t('performanceResult')}</th>
            </tr>
          </thead>
          <tbody>
            {response?.data.map((row) => (
              <tr key={row.id}>
                <td>{row.studentName}</td>
                <td>{t(row.passed ? 'passed' : 'notPassed')}</td>
                <td>
                  {row.presentCount}/{row.applicableCount} ·{' '}
                  {percentage(row.presentCount, row.applicableCount)}
                </td>
                <td>
                  {row.satisfactoryCount}/{row.presentCount} ·{' '}
                  {percentage(row.satisfactoryCount, row.presentCount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(response?.count || 0) > 20 && (
        <div className='pagination'>
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            {t('previous')}
          </Button>
          <span>{page}</span>
          <Button
            disabled={page * 20 >= (response?.count || 0)}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('next')}
          </Button>
        </div>
      )}
    </section>
  );
}
