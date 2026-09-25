import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { GET, POST } from '@/lib/crud';
import type { User } from '@/types';
const AdminContext = createContext<{
  admin: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadAdmin: () => Promise<void>;
}>({
  admin: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  reloadAdmin: async () => {},
});
export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const reloadAdmin = useCallback(async () => {
    const response = await GET<User>('/auth/me');
    setAdmin(response.data.role === 'ADMIN' ? response.data : null);
  }, []);
  useEffect(() => {
    let active = true;
    const clear = () => setAdmin(null);
    window.addEventListener('khiarukum:unauthorized', clear);
    GET<User>('/auth/me')
      .then((r) => {
        if (active) setAdmin(r.data.role === 'ADMIN' ? r.data : null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener('khiarukum:unauthorized', clear);
    };
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const r = await POST<{ user: User }>('/auth/login', {
      identifier: email,
      password,
      client: 'web',
    });
    setAdmin(r.data.user);
  }, []);
  const logout = useCallback(async () => {
    await POST('/auth/logout');
    setAdmin(null);
  }, []);
  return (
    <AdminContext.Provider
      value={{ admin, loading, login, logout, reloadAdmin }}
    >
      {children}
    </AdminContext.Provider>
  );
}
export const useAdmin = () => useContext(AdminContext);
