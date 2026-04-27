import api from './axiosInstance';
import type { AuthTokens, LoginPayload, RegisterPayload } from '@/types/auth';

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthTokens>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthTokens>('/auth/login', payload).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
};
