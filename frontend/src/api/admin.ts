import api from './axiosInstance';
import type { SpringPage } from '@/types/job';

export interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalFreelancers: number;
  bannedUsers: number;
  pendingVerifications: number;
  totalJobs: number;
  openJobs: number;
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  banned: boolean;
  emailVerified: boolean;
  profileImageUrl?: string;
  rating?: number;
  title?: string;
  createdAt: string;
}

export interface AdminJob {
  id: string;
  title: string;
  category: string;
  status: string;
  clientId: number;
  clientName?: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: string;
  createdAt: string;
}

export interface AdminDispute {
  id: string;
  contractId: string;
  jobTitle: string;
  openedByName: string;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolutionNote?: string;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  milestoneTitle: string;
  contractId: string;
  clientName: string;
  freelancerName: string;
  amount: number;
  status: 'ESCROWED' | 'RELEASED';
  createdAt: string;
}

export interface AdminPaymentSummary {
  totalRevenue: number;
  escrowed: number;
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export const adminApi = {
  getStats: () =>
    api.get<AdminStats>('/admin/stats').then(r => r.data),

  getUsers: (page = 0, size = 20, role?: string, q?: string, status?: string) =>
    api.get<SpringPage<AdminUser>>('/admin/users', {
      params: { page, size, role: role || undefined, q: q || undefined, status: status || undefined },
    }).then(r => r.data),

  banUser: (id: number) =>
    api.patch(`/admin/users/${id}/ban`).then(r => r.data),

  unbanUser: (id: number) =>
    api.patch(`/admin/users/${id}/unban`).then(r => r.data),

  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`).then(r => r.data),

  getJobs: (page = 0, size = 20, status?: string) =>
    api.get<SpringPage<AdminJob>>('/admin/jobs', { params: { page, size, status: status || undefined } }).then(r => r.data),

  getDisputes: (page = 0, size = 20, status?: string) =>
    api.get<SpringPage<AdminDispute>>('/admin/disputes', { params: { page, size, status: status || undefined } }).then(r => r.data),

  markDisputeUnderReview: (id: string) =>
    api.patch<AdminDispute>(`/admin/disputes/${id}/under-review`).then(r => r.data),

  resolveDispute: (id: string, resolutionNote: string) =>
    api.patch<AdminDispute>(`/admin/disputes/${id}/resolve`, { resolutionNote }).then(r => r.data),

  getPayments: (page = 0, size = 20, status?: string) =>
    api.get<SpringPage<AdminPayment>>('/admin/payments', { params: { page, size, status: status || undefined } }).then(r => r.data),

  getPaymentSummary: () =>
    api.get<AdminPaymentSummary>('/admin/payments/summary').then(r => r.data),

  getRevenueAnalytics: (months = 12) =>
    api.get<AnalyticsPoint[]>('/admin/analytics/revenue', { params: { months } }).then(r => r.data),

  getUserAnalytics: (weeks = 12) =>
    api.get<AnalyticsPoint[]>('/admin/analytics/users', { params: { weeks } }).then(r => r.data),

  getBidsAnalytics: () =>
    api.get<AnalyticsPoint[]>('/admin/analytics/bids').then(r => r.data),

  getDisputesAnalytics: (months = 12) =>
    api.get<AnalyticsPoint[]>('/admin/analytics/disputes', { params: { months } }).then(r => r.data),
};
