import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage, useTranslations } from '@/i18n';
import { useRequest } from '@/hooks/useRequest';
import { localized } from '@/utils';
import type { RecordData } from '@/types';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';
import { GET_FILE } from '@/lib/crud';
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
    <div className='group-detail-page'>
      <section className='group-detail-hero'>
        <div className='group-detail-heading'>
          <span className='group-detail-kicker'>
            {t(row.endedAt ? 'completionResults' : 'groupDetails')}
          </span>
          <h1>{localized(row, locale)}</h1>
          <p>{localized(row.program, locale)}</p>
        </div>
        {row.endedAt ? (
          <span className='group-ended-badge'>
            <span className='group-ended-dot' />
            {t('ended')} <span aria-hidden='true'>·</span>{' '}
            {row.endedAt.slice(0, 10)}
          </span>
        ) : (
          <Link className='button button-outline' to={`/edit-group/${id}`}>
            {t('edit')}
          </Link>
        )}
      </section>
      {row.endedAt && <Results id={id!} criteria={row} />}
    </div>
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
  const [downloading, setDownloading] = useState<string>();
  const [downloadError, setDownloadError] = useState(false);
  const summary = response?.certificateSummary;
  const passingCount = Number(summary?.passingCount || 0);
  const certificatesReady =
    passingCount > 0 && Number(summary?.readyCount || 0) === passingCount;
  const studentCount = response?.count ?? response?.data.length ?? 0;
  async function download(route: string, filename: string, key: string) {
    setDownloading(key);
    setDownloadError(false);
    try {
      const blob = await GET_FILE(route);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(undefined);
    }
  }
  if (loading) return <Loading />;
  if (error)
    return (
      <>
        <p role='alert'>{t('resultsFailed')}</p>
        <Button onClick={() => refresh((n) => n + 1)}>{t('retry')}</Button>
      </>
    );
  return (
    <section className='completion-panel'>
      <div className='completion-panel-header'>
        <div>
          <span className='group-detail-kicker'>{t('ended')}</span>
          <h2>{t('completionResults')}</h2>
          <p className='completion-criteria'>
            {t('minAttendancePercent')}: {criteria.minAttendancePercent}%
            <span aria-hidden='true'> · </span>
            {t('minSatisfactoryPercent')}: {criteria.minSatisfactoryPercent}%
          </p>
        </div>
        <Button
          disabled={!certificatesReady || !!downloading}
          onClick={() =>
            void download(
              `/certificates/groups/${id}/download`,
              `group-${id}-certificates.zip`,
              'group',
            )
          }
        >
          {downloading === 'group'
            ? t('downloading')
            : t('downloadAllCertificates')}
        </Button>
      </div>
      <div className='completion-stats' aria-label={t('completionResults')}>
        <div className='completion-stat'>
          <span className='completion-stat-value'>{studentCount}</span>
          <span className='completion-stat-label'>{t('students')}</span>
        </div>
        <div className='completion-stat completion-stat-passed'>
          <span className='completion-stat-value'>{passingCount}</span>
          <span className='completion-stat-label'>{t('passed')}</span>
        </div>
        <div className='completion-stat completion-stat-certificates'>
          <span className='completion-stat-value'>
            {Number(summary?.readyCount || 0)}
          </span>
          <span className='completion-stat-label'>
            {t('certificatesReady')}
          </span>
        </div>
      </div>
      {passingCount === 0 ? (
        <p className='completion-notice'>{t('noPassingCertificates')}</p>
      ) : !certificatesReady ? (
        <p className='completion-notice'>{t('certificatesPreparing')}</p>
      ) : null}
      {downloadError && (
        <p role='alert' className='completion-notice error'>
          {t('downloadFailed')}
        </p>
      )}
      <div className='completion-roster-heading'>
        <h3>{t('students')}</h3>
        <span>{studentCount}</span>
      </div>
      <div className='table-wrap completion-table-wrap'>
        <table>
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('status')}</th>
              <th>{t('attendanceResult')}</th>
              <th>{t('performanceResult')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {response?.data.map((row) => (
              <tr key={row.id}>
                <td>{row.studentName}</td>
                <td>
                  <span
                    className={`completion-status-pill ${row.passed ? 'is-passed' : 'is-failed'}`}
                  >
                    {t(row.passed ? 'passed' : 'notPassed')}
                  </span>
                </td>
                <td>
                  {row.presentCount}/{row.applicableCount} ·{' '}
                  {percentage(row.presentCount, row.applicableCount)}
                </td>
                <td>
                  {row.satisfactoryCount}/{row.presentCount} ·{' '}
                  {percentage(row.satisfactoryCount, row.presentCount)}
                </td>
                <td>
                  {row.passed && row.certificate?.status === 'READY' ? (
                    <Button
                      disabled={!!downloading}
                      onClick={() =>
                        void download(
                          `/certificates/${row.certificate.id}/download`,
                          `certificate-${row.certificate.id}.pdf`,
                          row.certificate.id,
                        )
                      }
                    >
                      {downloading === row.certificate.id
                        ? t('downloading')
                        : t('downloadCertificate')}
                    </Button>
                  ) : row.passed ? (
                    <Button disabled>
                      {t('certificateDownloadPreparing')}
                    </Button>
                  ) : null}
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
