import { useLanguage } from '@/i18n';
export default function LanguageSelect() {
  const { locale, setLocale } = useLanguage();
  return (
    <select
      className='language-select'
      aria-label='Language / اللغة'
      value={locale}
      onChange={(e) => setLocale(e.target.value as 'ar' | 'en')}
    >
      <option value='ar'>العربية</option>
      <option value='en'>English</option>
    </select>
  );
}
