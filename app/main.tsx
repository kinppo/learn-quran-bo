import { createRoot } from 'react-dom/client';
import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { LanguageProvider, useTranslations } from '@/i18n';
import { AdminProvider } from '@/contexts/AdminContext';
import DefaultLayout from '@/components/Layout/DefaultLayout';
import Login from '@/(pages)/auth/login/page';
import Dashboard from '@/(pages)/dashboard/page';
import Loading from '@/components/Loaders/Loading';
import { resources, type ResourceKey } from '@/constants/resources';
import '@/styles/globals.css';
const pages: Record<string, ComponentType> = {
  students: lazy(() => import('@/(pages)/students/page')),
  'waiting-list': lazy(() => import('@/(pages)/waiting-list/page')),
  support: lazy(() => import('@/(pages)/support/page')),
  'support/detail': lazy(() => import('@/(pages)/support/detail/page')),
  'students/edit': lazy(() => import('@/(pages)/students/edit/page')),
  teachers: lazy(() => import('@/(pages)/teachers/page')),
  'teachers/add': lazy(() => import('@/(pages)/teachers/add/page')),
  'teachers/edit': lazy(() => import('@/(pages)/teachers/edit/page')),
  groups: lazy(() => import('@/(pages)/groups/page')),
  'groups/add': lazy(() => import('@/(pages)/groups/add/page')),
  'groups/edit': lazy(() => import('@/(pages)/groups/edit/page')),
  programs: lazy(() => import('@/(pages)/programs/page')),
  'programs/add': lazy(() => import('@/(pages)/programs/add/page')),
  'programs/edit': lazy(() => import('@/(pages)/programs/edit/page')),
  categories: lazy(() => import('@/(pages)/categories/page')),
  'categories/add': lazy(() => import('@/(pages)/categories/add/page')),
  'categories/edit': lazy(() => import('@/(pages)/categories/edit/page')),
  riwayat: lazy(() => import('@/(pages)/riwayat/page')),
  'riwayat/add': lazy(() => import('@/(pages)/riwayat/add/page')),
  'riwayat/edit': lazy(() => import('@/(pages)/riwayat/edit/page')),
};
function Page({ path }: { path: string }) {
  const Component = pages[path];
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
}
function NotFound() {
  const t = useTranslations();
  return (
    <>
      <h1>{t('notFound')}</h1>
      <Link to='/'>{t('dashboard')}</Link>
    </>
  );
}
function App() {
  return (
    <LanguageProvider>
      <AdminProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route element={<DefaultLayout />}>
              <Route index element={<Dashboard />} />
              <Route path='/dashboard' element={<Dashboard />} />
              <Route
                path='/waiting-list'
                element={<Page path='waiting-list' />}
              />
              <Route path='/support' element={<Page path='support' />} />
              <Route
                path='/support/:id'
                element={<Page path='support/detail' />}
              />
              {(Object.keys(resources) as ResourceKey[]).map((key) => (
                <Route key={key}>
                  <Route
                    path={'/' + key}
                    element={<Page key={key} path={key} />}
                  />
                  {key !== 'students' && (
                    <Route
                      path={'/add-' + resources[key].singular}
                      element={<Page key={key + 'add'} path={key + '/add'} />}
                    />
                  )}
                  <Route
                    path={'/edit-' + resources[key].singular + '/:id'}
                    element={<Page key={key + 'edit'} path={key + '/edit'} />}
                  />
                </Route>
              ))}
              <Route path='*' element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </LanguageProvider>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
