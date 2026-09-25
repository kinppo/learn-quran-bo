import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';
import { useRequest } from '@/hooks/useRequest';
import { PATCH } from '@/lib/crud';
import { useLanguage, useTranslations } from '@/i18n';
import { localized } from '@/utils';
import { errorKey } from '@/utils/errors';
import type { RecordData } from '@/types';

function DeclineDialog({
  reason,
  error,
  busy,
  onReasonChange,
  onSubmit,
  onClose,
}: {
  reason: string;
  error: string;
  busy: boolean;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useTranslations();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className='decline-dialog'
      aria-labelledby='decline-title'
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id='decline-title'>{t('reject')}</h2>
      <div className='field'>
        <textarea
          autoFocus
          aria-label={t('rejectionReason')}
          placeholder={t('rejectionReason')}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={5}
        />
      </div>
      {error && <p className='error'>{t(error)}</p>}
      <div className='actions'>
        <Button variant='outline' disabled={busy} onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button variant='destructive' isLoading={busy} onClick={onSubmit}>
          {t('decline')}
        </Button>
      </div>
    </dialog>
  );
}

export default function WaitingListPage() {
  const t = useTranslations();
  const { locale } = useLanguage();
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [groups, setGroups] = useState<Record<string, string>>({});
  const [declineId, setDeclineId] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [declineError, setDeclineError] = useState('');
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

  async function review(
    id: string,
    action: 'approve' | 'reject',
    rejectionReason?: string,
  ) {
    const groupId = groups[id];
    const reason = rejectionReason?.trim();
    if ((action === 'approve' && !groupId) || (action === 'reject' && !reason))
      return action === 'approve'
        ? setNotice('selectMatchingGroup')
        : setDeclineError('reasonRequired');
    setBusy(id);
    setNotice('');
    setDeclineError('');
    try {
      await PATCH(
        `/admin/waiting-list/${id}/${action}`,
        action === 'approve' ? { groupId } : { reason },
      );
      setNotice('saved');
      if (action === 'reject') {
        setDeclineId('');
        setDeclineReason('');
      }
      setRevision((value) => value + 1);
    } catch (error) {
      const key = errorKey(error);
      if (action === 'reject') setDeclineError(key);
      else setNotice(key);
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
                            <Button
                              variant='destructive'
                              isLoading={busy === request.id}
                              onClick={() => {
                                setDeclineId(request.id);
                                setDeclineReason('');
                                setDeclineError('');
                              }}
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
      {declineId && (
        <DeclineDialog
          reason={declineReason}
          error={declineError}
          busy={busy === declineId}
          onReasonChange={setDeclineReason}
          onSubmit={() => void review(declineId, 'reject', declineReason)}
          onClose={() => {
            setDeclineId('');
            setDeclineReason('');
            setDeclineError('');
          }}
        />
      )}
    </>
  );
}
