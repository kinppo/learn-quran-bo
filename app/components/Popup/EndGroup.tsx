import { useEffect, useRef, useState } from 'react';
import { useLanguage, useTranslations } from '@/i18n';
import { GET, POST } from '@/lib/crud';
import { localized, recordId } from '@/utils';
import type { RecordData } from '@/types';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';

export default function EndGroup({
  group,
  onClose,
  onEnded,
}: {
  group: RecordData;
  onClose: () => void;
  onEnded: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { locale } = useLanguage();
  const t = useTranslations();
  const [preview, setPreview] = useState<RecordData>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
    GET(`/groups/${recordId(group)}/completion-preview`)
      .then((response) => setPreview(response.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [group]);

  async function end() {
    setBusy(true);
    setError(false);
    try {
      await POST(`/groups/${recordId(group)}/end`);
      onEnded();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className='end-group-dialog'
      aria-labelledby='end-group-title'
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id='end-group-title'>{t('endGroup')}</h2>
      <p className='dialog-subtitle'>
        {localized(group, locale)} · {localized(group.program, locale)}
      </p>
      {loading ? (
        <Loading />
      ) : error || !preview ? (
        <p role='alert' className='error'>
          {t('resultsFailed')}
        </p>
      ) : (
        <>
          <p>{t('endHelp')}</p>
          <p>
            {t('minAttendancePercent')}: {preview.criteria.minAttendancePercent}
            %{' · '}
            {t('minSatisfactoryPercent')}:{' '}
            {preview.criteria.minSatisfactoryPercent}%
          </p>
          <div className='completion-counts'>
            <span className='badge ACTIVE'>
              {t('passed')}: {preview.passedCount}
            </span>
            <span className='badge INACTIVE'>
              {t('notPassed')}: {preview.notPassedCount}
            </span>
          </div>
          {!!preview.blockers.length && (
            <ul className='completion-blockers'>
              {preview.blockers.map((blocker: RecordData, index: number) => (
                <li key={index}>
                  {t(blocker.reason)} ·{' '}
                  {blocker.startsAt
                    ? new Date(blocker.startsAt).toLocaleString()
                    : blocker.sessionId}
                  {blocker.studentId && ` · ${blocker.studentId}`}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <div className='actions'>
        <Button variant='outline' disabled={busy} onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button
          variant='destructive'
          isLoading={busy}
          disabled={!preview || error || preview.blockers.length > 0}
          onClick={() => void end()}
        >
          {t('confirmEnd')}
        </Button>
      </div>
    </dialog>
  );
}
