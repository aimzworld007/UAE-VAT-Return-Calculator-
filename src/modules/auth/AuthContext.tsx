import React from 'react';
import { setStoredToken } from '../../shared/utils/apiClient';

type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  role?: 'USER' | 'SUPERADMIN';
  isActive?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (payload: { fullName: string; email: string; password: string; confirmPassword: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (next: Pick<AuthUser, 'fullName' | 'phone' | 'address'>) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);
const AUTH_API = '/api/auth';
const USERS_API = '/api/users';
const USER_KEY = 'fta_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const readStoredUser = (): AuthUser | null => {
    try {
      const saved = window.localStorage.getItem(USER_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  };

  const [user, setUser] = React.useState<AuthUser | null>(() => readStoredUser());
  const [loading, setLoading] = React.useState(true);


  React.useEffect(() => {
    let active = true;

    const bootstrapAuth = async () => {
      try {
        const res = await fetch(`${USERS_API}/me`, { method: 'GET', credentials: 'include' });
        const data = await readResponseBody(res);
        if (!active) return;
        if (!res.ok) {
          setStoredToken(null);
          persistUser(null);
          return;
        }

        const accessToken = data?.data?.accessToken ?? data?.accessToken;
        if (typeof accessToken === 'string' && accessToken) setStoredToken(accessToken);
        const refreshedUser = getUserFromResponse(data);
        persistUser(refreshedUser);
      } catch {
        if (active) persistUser(readStoredUser());
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);
  const persistUser = (next: AuthUser | null) => {
    setUser(next);
    try {
      if (next) window.localStorage.setItem(USER_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage failures so auth state still works in restricted browsers.
    }
  };

  const readResponseBody = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return res.json();
    const text = await res.text();
    return { error: text || 'Unexpected server response' };
  };

  const getUserFromResponse = (payload: any): AuthUser | null => {
    if (!payload || typeof payload !== 'object') return null;
    return payload.user ?? payload.data?.user ?? null;
  };

  const getErrorFromResponse = (payload: any, fallback: string) => {
    return payload?.message || payload?.error || fallback;
  };

  const login = React.useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await readResponseBody(res);
      if (!res.ok) return { ok: false, error: getErrorFromResponse(data, 'Login failed') };
      const accessToken = data?.data?.accessToken ?? data?.accessToken;
      if (typeof accessToken === 'string' && accessToken) setStoredToken(accessToken);
      const loggedInUser = getUserFromResponse(data);
      if (!loggedInUser) return { ok: false, error: 'Login failed: invalid server response' };
      persistUser(loggedInUser);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Unable to reach server. Ensure backend is running and reachable.',
      };
    }
    finally { setLoading(false); }
  }, []);

  const register = React.useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/register`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await readResponseBody(res);
      if (!res.ok) return { ok: false, error: getErrorFromResponse(data, 'Registration failed') };
      const accessToken = data?.data?.accessToken ?? data?.accessToken;
      if (typeof accessToken === 'string' && accessToken) setStoredToken(accessToken);
      const registeredUser = getUserFromResponse(data);
      if (!registeredUser) return { ok: false, error: 'Registration failed: invalid server response' };
      persistUser(registeredUser);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Unable to reach server. Ensure backend is running and reachable.',
      };
    }
    finally { setLoading(false); }
  }, [login]);

  const logout = React.useCallback(async () => {
    setStoredToken(null);
    persistUser(null);
    await fetch(`${AUTH_API}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);



  const refreshUser = React.useCallback(async () => {
    try {
      const res = await fetch(`${USERS_API}/me`, { method: 'GET', credentials: 'include' });
      const data = await readResponseBody(res);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) setStoredToken(null);
        return;
      }
      const accessToken = data?.data?.accessToken ?? data?.accessToken;
      if (typeof accessToken === 'string' && accessToken) setStoredToken(accessToken);
      const refreshedUser = getUserFromResponse(data);
      if (refreshedUser) persistUser(refreshedUser);
    } catch {}
  }, []);

  const changePassword = React.useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch(`${USERS_API}/me/password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await readResponseBody(res);
      if (!res.ok) return { ok: false, error: getErrorFromResponse(data, 'Password change failed') };
      const next = getUserFromResponse(data);
      if (next) persistUser({ ...user, ...next } as AuthUser);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to reach server. Ensure backend is running and reachable.' };
    }
  }, [user]);

  const updateProfile = React.useCallback(async (next) => {
    try {
      const res = await fetch(`${USERS_API}/me`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      const data = await readResponseBody(res);
      if (!res.ok) return { ok: false, error: getErrorFromResponse(data, 'Update failed') };
      const updatedUser = getUserFromResponse(data);
      if (!updatedUser) return { ok: false, error: 'Update failed: invalid server response' };
      persistUser(updatedUser);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Unable to reach server. Ensure backend is running and reachable.',
      };
    }
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile, changePassword }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
