import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import { userApi } from '@/api/user';
import type { LoginPayload, RegisterPayload } from '@/types/auth';
import type { UserProfile } from '@/types/user';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Restore session: if we have a token, fetch the user profile
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      userApi
        .getMe()
        .then(u => {
          setUser(u);
          setIsAuthenticated(true);
        })
        .catch(() => {
          sessionStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<UserProfile> => {
    const tokens = await authApi.login(payload);
    sessionStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    const u = await userApi.getMe();
    setUser(u);
    setIsAuthenticated(true);
    return u;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => {});
    }
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await userApi.getMe();
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
