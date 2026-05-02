import api from './axiosInstance';
import type { MilestoneResponse, CreateMilestoneRequest, MilestoneSummary } from '@/types/milestone';

export const milestonesApi = {
  createMilestones: async (contractId: string, requests: CreateMilestoneRequest[]): Promise<void> => {
    await api.post(`/milestones/contracts/${contractId}`, requests);
  },

  getMilestonesByContract: async (contractId: string): Promise<MilestoneResponse[]> => {
    const { data } = await api.get(`/milestones/contract/${contractId}`);
    return data;
  },

  getFreelancerMilestones: async (): Promise<MilestoneResponse[]> => {
    const { data } = await api.get('/milestones/freelancer');
    return data;
  },

  fundMilestone: async (milestoneId: string): Promise<void> => {
    await api.patch(`/milestones/${milestoneId}/fund`);
  },

  submitMilestone: async (milestoneId: string): Promise<void> => {
    await api.patch(`/milestones/${milestoneId}/submit`);
  },

  approveMilestone: async (milestoneId: string): Promise<void> => {
    await api.patch(`/milestones/${milestoneId}/approve`);
  },

  getSummaryForClient: async (): Promise<MilestoneSummary> => {
    const { data } = await api.get('/milestones/summary/client');
    return data;
  },

  getSummaryForFreelancer: async (): Promise<MilestoneSummary> => {
    const { data } = await api.get('/milestones/summary/freelancer');
    return data;
  },
};
