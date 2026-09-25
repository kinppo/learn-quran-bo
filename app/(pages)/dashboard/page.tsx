import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, useTranslations } from '@/i18n';
import { useRequest } from '@/hooks/useRequest';
import type { RecordData } from '@/types';
import { recordId } from '@/utils';
import { cellValue } from '@/components/Tables/ResourceTable';

function Metric({
  resource,
  revision,
}: {
  resource: string;
  revision: number;
}) {
  const t = useTranslations();
  const { locale } = useLanguage();
  const { response, loading, error } = useRequest<RecordData[]>(
    `/${resource}?limit=1&page=1`,
    revision,
  );
  return (
    <Link className='card dashboard-metric' to={`/${resource}`}>
      <span>{t(resource)}</span>
      <strong>
        {loading
          ? '…'
          : error || response?.count === undefined
            ? '—'
            : new Intl.NumberFormat(locale).format(response.count)}
      </strong>
      <small className={error ? 'error' : 'muted'}>
        {loading
          ? t('loading')
          : error
            ? t('dashboardUnavailable')
            : t('dashboardManage')}
      </small>
    </Link>
  );
}
function StudentPanel({
  waiting,
  revision,
}: {
  waiting?: boolean;
  revision: number;
}) {
  const t = useTranslations();
  const { locale } = useLanguage();
  const [retry, setRetry] = useState(0);
  const { response, loading, error } = useRequest<RecordData[]>(
    waiting
      ? '/admin/waiting-list?limit=5&page=1&order=asc&status=PENDING'
      : '/students?limit=5&page=1&orderBy=createdAt&order=desc',
    revision + retry,
  );
  return (
    <section className='card dashboard-panel' aria-busy={loading}>
      <div className='page-title'>
        <h2>{t(waiting ? 'dashboardWaiting' : 'dashboardRecent')}</h2>
        <Link
          className='row-link'
          to={
            waiting ? '/waiting-list' : '/students?orderBy=createdAt&order=desc'
          }
        >
          {t('dashboardViewAll')}
        </Link>
      </div>
      <p className='muted'>
        {t(waiting ? 'dashboardWaitingHelp' : 'dashboardRecentHelp')}
      </p>
      {loading ? (
        <p role='status'>{t('loading')}</p>
      ) : error ? (
        <div role='alert'>
          <p className='error'>{t('error')}</p>
          <button
            className='button button-outline'
            onClick={() => setRetry((n) => n + 1)}
          >
            {t('retry')}
          </button>
        </div>
      ) : (
        <>
          {waiting && response?.count !== undefined && (
            <p className='notice'>
              {t('dashboardWaitingCount', { count: response.count })}
            </p>
          )}
          {!response?.data.length ? (
            <p className='empty'>
              {t(waiting ? 'dashboardNoWaiting' : 'empty')}
            </p>
          ) : (
            <ul className='dashboard-students'>
              {response.data.map((row) => (
                <li key={recordId(row)}>
                  <Link
                    to={
                      waiting ? '/waiting-list' : `/students/${recordId(row)}`
                    }
                  >
                    <span>
                      <strong>
                        {cellValue(waiting ? row.student : row, 'name', locale)}
                      </strong>
                      <small className='muted'>
                        {t('createdAt')}: {cellValue(row, 'createdAt', locale)}
                      </small>
                    </span>
                    <span
                      className={`badge ${waiting ? row.status : row.user?.status || row.status}`}
                    >
                      {t(
                        waiting
                          ? row.status
                          : row.user?.status || row.status || 'notAvailable',
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
export default function Dashboard() {
  const t = useTranslations();
  const [revision, setRevision] = useState(0);
  return (
    <div className='dashboard'>
      <div className='page-title'>
        <div>
          <h1>{t('dashboardOverview')}</h1>
          <p className='muted'>{t('dashboardIntro')}</p>
        </div>
        <button
          className='button button-outline'
          onClick={() => setRevision((n) => n + 1)}
        >
          {t('dashboardRefresh')}
        </button>
      </div>
      <div className='dashboard-metrics'>
        {['students', 'teachers', 'groups', 'programs'].map((resource) => (
          <Metric key={resource} resource={resource} revision={revision} />
        ))}
      </div>
      <section className='card'>
        <h2>{t('dashboardQuickActions')}</h2>
        <div className='actions'>
          {[
            ['/add-teacher', 'dashboardAddTeacher'],
            ['/add-auditor', 'dashboardAddAuditor'],
            ['/add-group', 'dashboardAddGroup'],
            ['/add-program', 'dashboardAddProgram'],
            ['/students', 'dashboardManageStudents'],
          ].map(([to, label]) => (
            <Link key={to} className='button button-outline' to={to}>
              {t(label)}
            </Link>
          ))}
        </div>
      </section>
      <div className='dashboard-columns'>
        <StudentPanel waiting revision={revision} />
        <StudentPanel revision={revision} />
      </div>
    </div>
  );
}
