import api from './axiosInstance';
import type { AppNotification } from '@/types/notification';

export const notificationsApi = {
  getAll: async (): Promise<AppNotification[]> => {
    const { data } = await api.get('/notifications');
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications/unread-count');
    return data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
