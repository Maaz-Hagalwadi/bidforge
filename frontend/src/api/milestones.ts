import api from './axiosInstance';
import type { MilestoneResponse, CreateMilestoneRequest, MilestoneSummary } from '@/types/milestone';

export interface PaymentIntentData {
  clientSecret: string;
  amount: number;
}

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

  getClientMilestones: async (): Promise<MilestoneResponse[]> => {
    const { data } = await api.get('/milestones/client');
    return data;
  },

  createPaymentIntent: async (milestoneId: string): Promise<PaymentIntentData> => {
    const { data } = await api.post(`/milestones/${milestoneId}/create-payment-intent`);
    return data;
  },

  fundMilestone: async (milestoneId: string, paymentIntentId: string): Promise<void> => {
    await api.patch(`/milestones/${milestoneId}/fund`, { paymentIntentId });
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
