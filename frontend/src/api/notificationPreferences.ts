import axiosInstance from '@/api/axiosInstance';
import type { NotificationPreferenceDto } from '@/types/notificationPreferences';

export const notificationPreferencesApi = {
  getPreferences: (): Promise<NotificationPreferenceDto> =>
    axiosInstance.get('/users/me/notification-preferences').then(r => r.data),

  updatePreferences: (dto: NotificationPreferenceDto): Promise<NotificationPreferenceDto> =>
    axiosInstance.patch('/users/me/notification-preferences', dto).then(r => r.data),
};
