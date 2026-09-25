import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiChevronDown, FiGlobe } from 'react-icons/fi';
import { useLanguage } from '@/i18n';

export default function LanguageSelect() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const languages = [
    { value: 'ar' as const, name: 'العربية', code: 'AR' },
    { value: 'en' as const, name: 'English', code: 'EN' },
  ];
  const current = languages.find((language) => language.value === locale)!;

  return (
    <div className='language-menu' ref={ref}>
      <button
        type='button'
        className='language-trigger'
        aria-label='Language / اللغة'
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <FiGlobe className='language-globe' aria-hidden='true' />
        <span className='language-current-name'>{current.name}</span>
        <span className='language-current-code'>{current.code}</span>
        <FiChevronDown
          className={open ? 'language-chevron open' : 'language-chevron'}
          aria-hidden='true'
        />
      </button>
      {open && (
        <div className='language-dropdown' role='menu'>
          {languages.map((language) => (
            <button
              key={language.value}
              type='button'
              role='menuitemradio'
              aria-checked={locale === language.value}
              className={locale === language.value ? 'active' : ''}
              onClick={() => {
                setLocale(language.value);
                setOpen(false);
              }}
            >
              <span className='language-option-code'>{language.code}</span>
              <span>{language.name}</span>
              {locale === language.value && <FiCheck aria-hidden='true' />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
