import { useTranslations } from '@/i18n';
export default function Loading() {
  const t = useTranslations();
  return (
    <div className='loading' role='status'>
      <span className='spinner' />
      {t('loading')}
    </div>
  );
}
