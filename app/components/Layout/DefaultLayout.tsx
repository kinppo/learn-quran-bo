import { useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
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
} from 'react-icons/fi';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from '@/i18n';
import LanguageSelect from './LanguageSelect';
import Loading from '@/components/Loaders/Loading';
import Button from '@/components/Buttons/Button';
export default function DefaultLayout() {
  const { admin, loading, logout } = useAdmin();
  const t = useTranslations();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  if (loading) return <Loading />;
  if (!admin)
    return <Navigate to='/login' replace state={{ from: location.pathname }} />;
  const links = [
    ['dashboard', '/', FiHome],
    ['students', '/students', FiUsers],
    ['waitingList', '/waiting-list', FiClock],
    ['teachers', '/teachers', FiUser],
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
          <div className='admin-name'>
            <span className='avatar-letter'>{admin.firstName.slice(0, 1)}</span>
            <span>
              {admin.firstName} {admin.lastName}
            </span>
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
