import { useEffect, useRef } from 'react';
import Button from '@/components/Buttons/Button';
import { useTranslations } from '@/i18n';
export default function Confirm({
  onConfirm,
  onClose,
  busy,
}: {
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useTranslations();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby='confirm-title'
    >
      <h2 id='confirm-title'>{t('confirmDelete')}</h2>
      <p>{t('deleteHelp')}</p>
      <div className='actions'>
        <Button variant='outline' disabled={busy} onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button variant='destructive' isLoading={busy} onClick={onConfirm}>
          {t('delete')}
        </Button>
      </div>
    </dialog>
  );
}
