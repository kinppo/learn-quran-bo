import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiUser,
  FiBookOpen,
  FiLayers,
  FiFlag,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiClock,
  FiHelpCircle,
  FiChevronDown,
} from 'react-icons/fi';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from '@/i18n';
import LanguageSelect from './LanguageSelect';
import Loading from '@/components/Loaders/Loading';
import Button from '@/components/Buttons/Button';
import { API_URL } from '@/constants/env';
export default function DefaultLayout() {
  const { admin, loading, logout } = useAdmin();
  const t = useTranslations();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [error, setError] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node))
        setAccountOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);
  if (loading) return <Loading />;
  if (!admin)
    return <Navigate to='/login' replace state={{ from: location.pathname }} />;
  const links = [
    ['dashboard', '/', FiHome],
    ['students', '/students', FiUsers],
    ['waitingList', '/waiting-list', FiClock],
    ['teachers', '/teachers', FiUser],
    ['auditors', '/auditors', FiUser],
    ['groups', '/groups', FiBookOpen],
    ['programs', '/programs', FiLayers],
    ['riwayat', '/riwayat', FiFlag],
    ['categories', '/categories', FiGrid],
    ['support', '/support', FiHelpCircle],
  ] as const;
  return (
    <div className='layout'>
      <a href='#main' className='skip-link'>
        {t('administration')}
      </a>
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <img className='sidebar-logo' src='/images/icon.png' alt={t('brand')} />
        <nav>
          {links.map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end
              onClick={() => setOpen(false)}
              title={t(label)}
            >
              <Icon size={22} />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className='logout'
          onClick={() => {
            setError(false);
            void logout().catch(() => setError(true));
          }}
        >
          <FiLogOut size={22} />
          <span>{t('logout')}</span>
        </button>
      </aside>
      <div className='body'>
        <header>
          <Button
            variant='ghost'
            onClick={() => setOpen(!open)}
            aria-label={t('menu')}
          >
            <FiMenu size={22} />
          </Button>
          <div className='header-title'>{t('administration')}</div>
          <LanguageSelect />
          <div className='account-menu' ref={accountRef}>
            <button
              className='account-trigger'
              type='button'
              aria-haspopup='menu'
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
            >
              {admin.avatarId ? (
                <img
                  className='account-avatar'
                  src={`${API_URL}/media/${admin.avatarId}/download`}
                  alt=''
                />
              ) : (
                <span className='avatar-letter' aria-hidden='true'>
                  {admin.firstName.slice(0, 1)}
                  {admin.lastName.slice(0, 1)}
                </span>
              )}
              <span className='account-copy'>
                <strong>
                  {admin.firstName} {admin.lastName}
                </strong>
                <small>{t('administrator')}</small>
              </span>
              <FiChevronDown
                className={
                  accountOpen ? 'account-chevron open' : 'account-chevron'
                }
                aria-hidden='true'
              />
            </button>
            {accountOpen && (
              <div className='account-dropdown' role='menu'>
                <Link to='/profile' role='menuitem'>
                  <FiUser aria-hidden='true' />
                  {t('myProfile')}
                </Link>
                <button
                  type='button'
                  role='menuitem'
                  onClick={() => {
                    setAccountOpen(false);
                    setError(false);
                    void logout().catch(() => setError(true));
                  }}
                >
                  <FiLogOut aria-hidden='true' />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </header>
        <main id='main'>
          {error && (
            <p role='alert' className='error'>
              {t('error')}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
