import api from './axiosInstance';
import type { UserProfile, UpdateProfilePayload } from '@/types/user';

export const userApi = {
  getMe: () => api.get<UserProfile>('/users/me').then(r => r.data),
  updateMe: (payload: UpdateProfilePayload) =>
    api.patch<UserProfile>('/users/me', payload).then(r => r.data),
  getUserById: (id: number) => api.get<UserProfile>(`/users/${id}`).then(r => r.data),
};
