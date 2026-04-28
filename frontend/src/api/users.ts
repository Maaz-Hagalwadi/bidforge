import api from './axiosInstance';

export interface FreelancerSearchResult {
  id: number;
  name: string;
  email: string;
  profileImageUrl?: string;
  rating?: number;
}

export const usersApi = {
  searchFreelancers: (q: string) =>
    api.get<FreelancerSearchResult[]>('/users/search', { params: { q } }).then(r => r.data),
};
