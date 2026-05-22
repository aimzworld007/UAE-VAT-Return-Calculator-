import React from 'react';
import { apiClient, setStoredToken } from '../../shared/utils/apiClient';

type AuthUser = {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  address?: string;
  role?: 'user' | 'superadmin' | 'USER' | 'SUPERADMIN';
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (payload: { name?: string; fullName?: string; email: string; password: string; confirmPassword?: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateProfile: (next: Pick<AuthUser, 'name' | 'fullName' | 'email' | 'phone' | 'address'>) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);
const AUTH_API = '/api/auth';
const USER_KEY = 'fta_auth_user';

function normalizeUser(input: any): AuthUser | null {
  if (!input || typeof input !== 'object') return null;
  return {
    id: input.id,
    name: input.name || input.fullName || input.full_name,
    fullName: input.fullName || input.full_name || input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    role: String(input.role || 'user').toLowerCase() as AuthUser['role'],
  };
}

function readUserFromResponse(payload: any): AuthUser | null {
  return normalizeUser(payload?.user || payload?.data?.user || null);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (!saved) return null;
      return normalizeUser(JSON.parse(saved));
    } catch {
      return null;
    }
  });

  const persistUser = React.useCallback((next: AuthUser | null) => {
    setUser(next);
    try {
      if (!next) localStorage.removeItem(USER_KEY);
      else localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const refreshMe = React.useCallback(async () => {
    try {
      const response = await apiClient<any>(`${AUTH_API}/me`);
      const nextUser = readUserFromResponse(response);
      persistUser(nextUser);
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) {
        persistUser(null);
      }
      throw error;
    }
  }, [persistUser]);

  React.useEffect(() => {
    let active = true;

    refreshMe()
      .catch(() => {
        if (active) {
          // Keep localStorage user on transient failures only when existing token likely valid.
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshMe]);

  const login = React.useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient<any>(`${AUTH_API}/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const token = response?.data?.token || response?.data?.accessToken || response?.token || response?.accessToken;
      if (token) setStoredToken(token);

      const nextUser = readUserFromResponse(response);
      if (!nextUser) return { ok: false, error: 'Login failed: invalid server response' };

      persistUser(nextUser);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || 'Unable to login' };
    } finally {
      setLoading(false);
    }
  }, [persistUser]);

  const register = React.useCallback(async (payload: { name?: string; fullName?: string; email: string; password: string; confirmPassword?: string }) => {
    setLoading(true);

    if (payload.confirmPassword && payload.password !== payload.confirmPassword) {
      setLoading(false);
      return { ok: false, error: 'Passwords do not match' };
    }

    try {
      const response = await apiClient<any>(`${AUTH_API}/register`, {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name || payload.fullName,
          fullName: payload.fullName || payload.name,
          email: payload.email,
          password: payload.password,
        }),
      });

      const token = response?.data?.token || response?.data?.accessToken || response?.token || response?.accessToken;
      if (token) setStoredToken(token);

      const nextUser = readUserFromResponse(response);
      if (!nextUser) return { ok: false, error: 'Registration failed: invalid server response' };

      persistUser(nextUser);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || 'Unable to register' };
    } finally {
      setLoading(false);
    }
  }, [persistUser]);

  const logout = React.useCallback(async () => {
    setStoredToken(null);
    persistUser(null);
    await apiClient(`${AUTH_API}/logout`, { method: 'POST' }).catch(() => {});
  }, [persistUser]);

  const updateProfile = React.useCallback(async (next: Pick<AuthUser, 'name' | 'fullName' | 'email' | 'phone' | 'address'>) => {
    try {
      const response = await apiClient<any>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: next.name || next.fullName,
          fullName: next.fullName || next.name,
          email: next.email,
          phone: next.phone,
          address: next.address,
        }),
      });

      const updated = readUserFromResponse(response);
      if (!updated) return { ok: false, error: 'Profile update failed: invalid server response' };

      persistUser(updated);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || 'Profile update failed' };
    }
  }, [persistUser]);

  const changePassword = React.useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await apiClient('/api/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || 'Password update failed' };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: refreshMe,
        refreshMe,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}