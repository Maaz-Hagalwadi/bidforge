import api from './axiosInstance';
import type { UserProfile } from '@/types/user';

export type FreelancerSearchResult = UserProfile;

export const usersApi = {
  searchFreelancers: (q: string) =>
    api.get<UserProfile[]>('/users/search', { params: { q } }).then(r => r.data),
};
