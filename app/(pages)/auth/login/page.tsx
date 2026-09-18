import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdmin } from '@/contexts/AdminContext';
import { useTranslations } from '@/i18n';
import Button from '@/components/Buttons/Button';
import Input from '@/components/Inputs/Input';
import Loading from '@/components/Loaders/Loading';
import LanguageSelect from '@/components/Layout/LanguageSelect';
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export default function Login() {
  const { admin, loading, login } = useAdmin();
  const t = useTranslations();
  const nav = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(false);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  if (loading) return <Loading />;
  if (admin) return <Navigate to='/' replace />;
  return (
    <div className='login-page'>
      <div className='login-language'>
        <LanguageSelect />
      </div>
      <img
        className='login-logo'
        src='/images/logo.png'
        alt={t('brand')}
      />
      <form
        onSubmit={handleSubmit(async (v) => {
          setError(false);
          try {
            await login(v.email, v.password);
            const from = location.state?.from;
            nav(
              typeof from === 'string' &&
                from.startsWith('/') &&
                !from.startsWith('//')
                ? from
                : '/',
              { replace: true },
            );
          } catch {
            setError(true);
          }
        })}
      >
        <Input control={control} name='email' type='email' required />
        <Input control={control} name='password' type='password' required />
        {error && (
          <p role='alert' className='error'>
            {t('invalidLogin')}
          </p>
        )}
        <Button type='submit' isLoading={formState.isSubmitting}>
          {t('login')}
        </Button>
      </form>
    </div>
  );
}
