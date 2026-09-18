import { useTranslations } from '@/i18n';
export default function Dashboard() {
  const t = useTranslations();
  return <h1>{t('dashboard')}</h1>;
}
