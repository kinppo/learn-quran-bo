import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';
import { useRequest } from '@/hooks/useRequest';
import { PATCH } from '@/lib/crud';
import { useLanguage, useTranslations } from '@/i18n';
import { localized } from '@/utils';
import { errorKey } from '@/utils/errors';
import type { RecordData } from '@/types';

export default function WaitingListPage() {
  const t = useTranslations();
  const { locale } = useLanguage();
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [groups, setGroups] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const requests = useRequest<RecordData[]>(
    `/admin/waiting-list?limit=100&page=1&order=asc${status ? `&status=${status}` : ''}`,
    revision,
  );
  const availableGroups = useRequest<RecordData[]>('/groups?limit=100&page=1');
  const rows = useMemo(
    () => requests.response?.data || [],
    [requests.response?.data],
  );
  const matching = useMemo(
    () =>
      Object.fromEntries(
        rows.map((request) => [
          request.id,
          (availableGroups.response?.data || []).filter(
            (group) =>
              group.active &&
              group.leftPlaces > 0 &&
              group.programId === request.programId &&
              group.riwayaId === request.riwayaId &&
              group.languageCode === request.languageCode,
          ),
        ]),
      ),
    [rows, availableGroups.response?.data],
  );

  async function review(id: string, action: 'approve' | 'reject') {
    const groupId = groups[id];
    const reason = reasons[id]?.trim();
    if ((action === 'approve' && !groupId) || (action === 'reject' && !reason))
      return setNotice(
        action === 'approve' ? 'selectMatchingGroup' : 'reasonRequired',
      );
    setBusy(id);
    setNotice('');
    try {
      await PATCH(
        `/admin/waiting-list/${id}/${action}`,
        action === 'approve' ? { groupId } : { reason },
      );
      setNotice('saved');
      setRevision((value) => value + 1);
    } catch (error) {
      setNotice(errorKey(error));
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <div className='page-title'>
        <h1>{t('waitingList')}</h1>
      </div>
      <section className='card'>
        <p className='muted'>{t('waitingListHelp')}</p>
        <div className='toolbar'>
          <label>
            {t('status')}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value=''>{t('all')}</option>
              {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {notice && (
          <p className={notice === 'saved' ? 'notice' : 'error'}>{t(notice)}</p>
        )}
        {requests.loading || availableGroups.loading ? (
          <Loading />
        ) : requests.error || availableGroups.error ? (
          <p className='error'>{t('error')}</p>
        ) : !rows.length ? (
          <p className='empty'>{t('dashboardNoWaiting')}</p>
        ) : (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>{t('student')}</th>
                  <th>{t('programId')}</th>
                  <th>{t('riwayaId')}</th>
                  <th>{t('languageCode')}</th>
                  <th>{t('status')}</th>
                  <th>{t('createdAt')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((request) => {
                  const user = request.student.user;
                  return (
                    <tr key={request.id}>
                      <td>
                        {user.firstName} {user.lastName}
                      </td>
                      <td>{localized(request.program, locale)}</td>
                      <td>{localized(request.riwaya, locale)}</td>
                      <td>{t(request.languageCode)}</td>
                      <td>
                        <span className={`badge ${request.status}`}>
                          {t(request.status)}
                        </span>
                        {request.rejectionReason && (
                          <small className='muted'>
                            {t('rejectionReason')}: {request.rejectionReason}
                          </small>
                        )}
                      </td>
                      <td>{dayjs(request.createdAt).format('YYYY-MM-DD')}</td>
                      <td>
                        {request.status === 'PENDING' ? (
                          <div className='actions'>
                            <select
                              aria-label={t('matchingGroup')}
                              value={groups[request.id] || ''}
                              onChange={(event) =>
                                setGroups((value) => ({
                                  ...value,
                                  [request.id]: event.target.value,
                                }))
                              }
                            >
                              <option value=''>{t('matchingGroup')}</option>
                              {(matching[request.id] || []).map(
                                (group: RecordData) => (
                                  <option key={group.id} value={group.id}>
                                    {localized(group, locale)} (
                                    {group.leftPlaces})
                                  </option>
                                ),
                              )}
                            </select>
                            <Button
                              isLoading={busy === request.id}
                              onClick={() => void review(request.id, 'approve')}
                            >
                              {t('approve')}
                            </Button>
                            <input
                              aria-label={t('rejectionReason')}
                              placeholder={t('rejectionReason')}
                              value={reasons[request.id] || ''}
                              onChange={(event) =>
                                setReasons((value) => ({
                                  ...value,
                                  [request.id]: event.target.value,
                                }))
                              }
                            />
                            <Button
                              variant='destructive'
                              isLoading={busy === request.id}
                              onClick={() => void review(request.id, 'reject')}
                            >
                              {t('reject')}
                            </Button>
                          </div>
                        ) : (
                          request.approvedGroup &&
                          localized(request.approvedGroup, locale)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
