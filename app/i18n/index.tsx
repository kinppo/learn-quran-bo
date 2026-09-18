import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { IntlProvider, useTranslations } from 'use-intl';
import { messages } from './messages';
import type { Locale } from '@/types';
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: 'ar', setLocale: () => {} });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem('khiarukum-locale') === 'en' ? 'en' : 'ar',
  );
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('khiarukum-locale', locale);
    document.title =
      locale === 'ar' ? 'خياركم — الإدارة' : 'Khiarukum — Administration';
  }, [locale]);
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider
        locale={locale}
        messages={messages[locale]}
        timeZone='Africa/Casablanca'
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
export const useLanguage = () => useContext(LocaleContext);
export { useTranslations };
