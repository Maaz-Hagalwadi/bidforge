export type ContractStatus = 'ACTIVE' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';

export interface ContractResponse {
  id: string;
  jobId: string;
  clientId: number;
  freelancerId: number;
  amount: number;
  status: ContractStatus;
  submissionNote?: string;
  submissionUrl?: string;
  submittedAt?: string;
  createdAt: string;
  jobTitle: string;
  deadline?: string;
  clientName: string;
  freelancerName: string;
  deliveryDays?: number;
}

export interface SubmitWorkPayload {
  submissionNote: string;
  submissionUrl: string;
}
