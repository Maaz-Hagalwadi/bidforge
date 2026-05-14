import axiosInstance from '@/api/axiosInstance';
import type { DisputeResponse, OpenDisputePayload } from '@/types/dispute';

export const disputesApi = {
  openDispute: (contractId: string, payload: OpenDisputePayload): Promise<DisputeResponse> =>
    axiosInstance.post(`/contracts/${contractId}/dispute`, payload).then(r => r.data),

  getMyDisputes: (): Promise<DisputeResponse[]> =>
    axiosInstance.get('/disputes/my').then(r => r.data),

  resolveDispute: (disputeId: string, resolutionNote: string): Promise<DisputeResponse> =>
    axiosInstance.patch(`/disputes/${disputeId}/resolve`, { resolutionNote }).then(r => r.data),
};
