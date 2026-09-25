import { useEffect, useState, type FormEvent } from 'react';
import { FiLock, FiUser } from 'react-icons/fi';
import Button from '@/components/Buttons/Button';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage, useTranslations } from '@/i18n';
import { PATCH, POST } from '@/lib/crud';
import { errorKey } from '@/utils/errors';
import type { Locale } from '@/types';

export default function ProfilePage() {
  const { admin, reloadAdmin, logout } = useAdmin();
  const { locale, setLocale } = useLanguage();
  const t = useTranslations();
  const [firstName, setFirstName] = useState(admin?.firstName ?? '');
  const [lastName, setLastName] = useState(admin?.lastName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(admin?.phoneNumber ?? '');
  const [selectedLocale, setSelectedLocale] = useState<Locale>(
    admin?.locale ?? locale,
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');

  useEffect(() => {
    if (!admin) return;
    setFirstName(admin.firstName);
    setLastName(admin.lastName);
    setPhoneNumber(admin.phoneNumber ?? '');
    setSelectedLocale(admin.locale);
  }, [admin]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const phone = phoneNumber.trim();
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      (phone && !/^\+?[0-9 ()-]{6,25}$/.test(phone))
    ) {
      setProfileNotice('validationError');
      return;
    }
    setProfileBusy(true);
    setProfileNotice('');
    try {
      await PATCH('/users/me', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone || null,
        locale: selectedLocale,
      });
      await reloadAdmin();
      setLocale(selectedLocale);
      setProfileNotice('profileSaved');
    } catch (error) {
      setProfileNotice(errorKey(error));
    } finally {
      setProfileBusy(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (
      !currentPassword ||
      password.length < 8 ||
      password.length > 72 ||
      password !== confirmPassword
    ) {
      setPasswordNotice('passwordRules');
      return;
    }
    setPasswordBusy(true);
    setPasswordNotice('');
    try {
      await POST('/users/me/password', { currentPassword, password });
      await logout();
    } catch (error) {
      setPasswordNotice(errorKey(error));
      setPasswordBusy(false);
    }
  }

  if (!admin) return null;

  return (
    <div className='profile-page'>
      <div className='page-title'>
        <div>
          <h1>{t('myProfile')}</h1>
          <p className='profile-intro'>{t('profileIntro')}</p>
        </div>
      </div>

      <section className='card profile-summary' aria-label={t('account')}>
        <span className='profile-avatar-large' aria-hidden='true'>
          {admin.firstName.slice(0, 1)}
          {admin.lastName.slice(0, 1)}
        </span>
        <div>
          <h2>
            {admin.firstName} {admin.lastName}
          </h2>
          <p>{admin.email}</p>
          <span className='profile-role'>{t('administrator')}</span>
        </div>
      </section>

      <div className='profile-columns'>
        <form className='card profile-form' onSubmit={saveProfile}>
          <div className='profile-section-title'>
            <FiUser aria-hidden='true' />
            <div>
              <h2>{t('personal')}</h2>
              <p>{t('personalHelp')}</p>
            </div>
          </div>
          <div className='form-grid'>
            <label className='field'>
              <span>{t('firstName')}</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={100}
                required
                disabled={profileBusy}
              />
            </label>
            <label className='field'>
              <span>{t('lastName')}</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={100}
                required
                disabled={profileBusy}
              />
            </label>
            <label className='field'>
              <span>{t('phoneNumber')}</span>
              <input
                type='tel'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={25}
                disabled={profileBusy}
              />
            </label>
            <label className='field'>
              <span>{t('locale')}</span>
              <select
                value={selectedLocale}
                onChange={(e) => setSelectedLocale(e.target.value as Locale)}
                disabled={profileBusy}
              >
                <option value='ar'>{t('ar')}</option>
                <option value='en'>{t('en')}</option>
              </select>
            </label>
          </div>
          <div className='profile-readonly'>
            <div>
              <span>{t('username')}</span>
              <strong>{admin.username}</strong>
            </div>
            <div>
              <span>{t('email')}</span>
              <strong>{admin.email}</strong>
            </div>
          </div>
          {profileNotice && (
            <p
              role='alert'
              className={profileNotice === 'profileSaved' ? 'success' : 'error'}
            >
              {t(profileNotice)}
            </p>
          )}
          <div className='form-actions'>
            <Button type='submit' isLoading={profileBusy}>
              {t('saveProfile')}
            </Button>
          </div>
        </form>

        <form className='card profile-form' onSubmit={changePassword}>
          <div className='profile-section-title'>
            <FiLock aria-hidden='true' />
            <div>
              <h2>{t('changePassword')}</h2>
              <p>{t('passwordRules')}</p>
            </div>
          </div>
          <label className='field'>
            <span>{t('currentPassword')}</span>
            <input
              type='password'
              autoComplete='current-password'
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={passwordBusy}
              required
            />
          </label>
          <label className='field'>
            <span>{t('newPassword')}</span>
            <input
              type='password'
              autoComplete='new-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={72}
              disabled={passwordBusy}
              required
            />
          </label>
          <label className='field'>
            <span>{t('confirmPassword')}</span>
            <input
              type='password'
              autoComplete='new-password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              maxLength={72}
              disabled={passwordBusy}
              required
            />
          </label>
          <p className='profile-signout-note'>{t('passwordSignOut')}</p>
          {passwordNotice && (
            <p role='alert' className='error'>
              {t(passwordNotice)}
            </p>
          )}
          <div className='form-actions'>
            <Button type='submit' isLoading={passwordBusy}>
              {t('changePassword')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
