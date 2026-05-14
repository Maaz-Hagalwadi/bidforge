import api from './axiosInstance';
import type { UserProfile, UpdateProfilePayload, PortfolioItem, AddPortfolioPayload } from '@/types/user';

export const userApi = {
  getMe: () => api.get<UserProfile>('/users/me').then(r => r.data),
  updateMe: (payload: UpdateProfilePayload) =>
    api.patch<UserProfile>('/users/me', payload).then(r => r.data),
  uploadProfileImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<UserProfile>('/users/profile-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  getUserById: (id: number) => api.get<UserProfile>(`/users/${id}`).then(r => r.data),
  getPortfolio: (userId: number) =>
    api.get<PortfolioItem[]>(`/users/${userId}/portfolio`).then(r => r.data),
  addPortfolioItem: (payload: AddPortfolioPayload) =>
    api.post<PortfolioItem>('/users/me/portfolio', payload).then(r => r.data),
  updatePortfolioItem: (itemId: number | string, payload: AddPortfolioPayload) =>
    api.put<PortfolioItem>(`/users/me/portfolio/${itemId}`, payload).then(r => r.data),
  deletePortfolioItem: (itemId: number | string) =>
    api.delete(`/users/me/portfolio/${itemId}`),
  uploadFile: (file: File): Promise<{ fileUrl: string; fileName: string; fileType: string }> => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};
