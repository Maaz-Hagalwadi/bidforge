import api from './axiosInstance';
import type { ClientDashboardData, FreelancerDashboardData } from '@/types/dashboard';

export const dashboardApi = {
  getClientDashboard: () =>
    api.get<ClientDashboardData>('/client/dashboard').then(r => r.data),

  getFreelancerDashboard: () =>
    api.get<FreelancerDashboardData>('/freelancer/dashboard').then(r => r.data),
};
