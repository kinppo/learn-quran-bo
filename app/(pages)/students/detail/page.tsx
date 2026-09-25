import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useLanguage, useTranslations } from '@/i18n';
import { GET } from '@/lib/crud';
import { localized } from '@/utils';
import { errorKey } from '@/utils/errors';
import type { RecordData } from '@/types';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';

export default function StudentDetails() {
  const { id } = useParams();
  const t = useTranslations();
  const { locale } = useLanguage();
  const [student, setStudent] = useState<RecordData>();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [statistics, setStatistics] = useState<RecordData>();
  const [monthlyStatistics, setMonthlyStatistics] = useState<RecordData>();
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    GET<RecordData>(`/students/${id}`)
      .then((response) => {
        if (active) {
          setStudent(response.data);
          const memberships = response.data.memberships || [];
          setSelectedGroupId(
            memberships.find((membership: RecordData) => membership.active)
              ?.groupId ||
              memberships[0]?.groupId ||
              '',
          );
        }
      })
      .catch((cause) => {
        if (active) setError(errorKey(cause));
      });
    return () => {
      active = false;
    };
  }, [id, revision]);

  useEffect(() => {
    if (!selectedGroupId) {
      setStatistics(undefined);
      setMonthlyStatistics(undefined);
      return;
    }
    let active = true;
    setStatisticsLoading(true);
    const base = new URLSearchParams({
      studentId: id!,
      groupId: selectedGroupId,
    });
    const monthly = new URLSearchParams(base);
    monthly.set('from', dayjs().startOf('month').toISOString());
    monthly.set('to', dayjs().toISOString());
    Promise.all([GET(`/kpi?${base}`), GET(`/kpi?${monthly}`)])
      .then(([allTime, currentMonth]) => {
        if (active) {
          setStatistics(allTime.data);
          setMonthlyStatistics(currentMonth.data);
        }
      })
      .catch(() => {
        if (active) {
          setStatistics(undefined);
          setMonthlyStatistics(undefined);
        }
      })
      .finally(() => {
        if (active) setStatisticsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, selectedGroupId]);

  if (error)
    return (
      <div role='alert'>
        <p className='error'>{t(error)}</p>
        <Button onClick={() => setRevision((value) => value + 1)}>
          {t('retry')}
        </Button>
      </div>
    );
  if (!student) return <Loading />;

  const user = student.user || student;
  const memberships: RecordData[] = student.memberships || [];
  const selectedMembership = memberships.find(
    (membership) => membership.groupId === selectedGroupId,
  );
  const group = selectedMembership?.group;
  const values: Array<[string, unknown]> = [
    ['academicNumber', student.academicNumber],
    ['firstName', user.firstName],
    ['lastName', user.lastName],
    ['email', user.email],
    ['username', user.username],
    ['gender', user.gender ? t(user.gender) : undefined],
    [
      'birthDate',
      user.birthDate ? dayjs(user.birthDate).format('YYYY-MM-DD') : undefined,
    ],
    ['phoneNumber', user.phoneNumber],
    ['locale', user.locale ? t(user.locale) : undefined],
    ['status', user.status ? t(user.status) : undefined],
    ['professionOther', user.professionOther],
    ['studyLevelId', localized(student.studyLevel, locale)],
    [
      'createdAt',
      user.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD') : undefined,
    ],
  ];

  return (
    <>
      <div className='page-title'>
        <h1>{t('studentData')}</h1>
        <Link to='/students'>{t('back')}</Link>
      </div>
      <div className='student-detail-sections'>
        <section className='card'>
          <div className='section-title'>
            <h2>{t('studentData')}</h2>
            <Link className='button button-primary' to={`/edit-student/${id}`}>
              {t('updateStudentData')}
            </Link>
          </div>
          <div className='read-only-details'>
            {values.map(([key, value]) => (
              <div className='detail-line' key={key}>
                <strong>{t(key)}</strong>
                <span>{String(value || '—')}</span>
              </div>
            ))}
          </div>
        </section>
        <section className='card' aria-label={t('academicOverview')}>
          <div className='section-title'>
            <h2>{t('academicOverview')}</h2>
            {memberships.length > 1 && (
              <label className='group-selector'>
                {t('groupId')}
                <select
                  value={selectedGroupId}
                  onChange={(event) => setSelectedGroupId(event.target.value)}
                >
                  {memberships.map((membership) => (
                    <option key={membership.groupId} value={membership.groupId}>
                      {localized(membership.group, locale)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {!selectedMembership ? (
            <p className='empty'>{t('noGroupMemberships')}</p>
          ) : (
            <div className='academic-card-grid'>
              <article className='sub-card'>
                <h3>{t('groupDetails')}</h3>
                {[
                  ['groupId', localized(group, locale)],
                  ['programId', localized(group?.program, locale)],
                  ['riwayaId', localized(group?.riwaya, locale)],
                  [
                    'languageCode',
                    group?.languageCode ? t(group.languageCode) : undefined,
                  ],
                  [
                    'membershipStatus',
                    selectedMembership.active ? t('ACTIVE') : t('INACTIVE'),
                  ],
                  [
                    'joinedAt',
                    selectedMembership.joinedAt
                      ? dayjs(selectedMembership.joinedAt).format('YYYY-MM-DD')
                      : undefined,
                  ],
                ].map(([key, value]) => (
                  <div className='detail-line' key={key}>
                    <strong>{t(String(key))}</strong>
                    <span>{String(value || '—')}</span>
                  </div>
                ))}
              </article>
              <article className='sub-card'>
                <h3>{t('statistics')}</h3>
                {statisticsLoading ? (
                  <Loading />
                ) : (
                  <>
                    <h4>{t('allTime')}</h4>
                    <StatisticRows
                      statistics={statistics}
                      t={t}
                      memorizedHizbCount={student.memorizedHizbCount}
                    />
                    <h4>{t('currentMonth')}</h4>
                    <StatisticRows statistics={monthlyStatistics} t={t} />
                  </>
                )}
              </article>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function StatisticRows({
  statistics,
  memorizedHizbCount,
  t,
}: {
  statistics?: RecordData;
  memorizedHizbCount?: number;
  t: (key: string) => string;
}) {
  const rows: Array<[string, string | number]> = [
    [
      'averageScore',
      statistics ? Number(statistics.averageScore || 0).toFixed(1) : '—',
    ],
    [
      'presencePercent',
      statistics
        ? `${Number(statistics.presencePercent || 0).toFixed(1)}%`
        : '—',
    ],
    ['attendanceCount', statistics?.attendanceCount ?? '—'],
  ];
  if (memorizedHizbCount !== undefined)
    rows.push(['memorizedHizbCount', memorizedHizbCount]);
  return rows.map(([key, value]) => (
    <div className='detail-line' key={key}>
      <strong>{t(key)}</strong>
      <span>{value}</span>
    </div>
  ));
}
