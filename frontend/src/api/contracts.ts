import api from './axiosInstance';
import type { ContractResponse, SubmitWorkPayload } from '@/types/contract';

export const contractsApi = {
  getClientContracts: async (): Promise<ContractResponse[]> => {
    const { data } = await api.get('/contracts/client');
    return data;
  },

  getFreelancerContracts: async (): Promise<ContractResponse[]> => {
    const { data } = await api.get('/contracts/freelancer');
    return data;
  },

  submitWork: async (contractId: string, payload: SubmitWorkPayload): Promise<void> => {
    await api.patch(`/contracts/${contractId}/submit-work`, payload);
  },

  completeContract: async (contractId: string): Promise<void> => {
    await api.patch(`/contracts/${contractId}/complete`);
  },
};
