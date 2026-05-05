export type ContractStatus = 'ACTIVE' | 'SUBMITTED' | 'COMPLETED' | 'REVISION_REQUESTED' | 'CANCELLED';

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
  revisionNote?: string;
  revisionRequestedAt?: string;
  createdAt: string;
  jobTitle: string;
  deadline?: string;
  clientName: string;
  freelancerName: string;
  deliveryDays?: number;
  reviewedByClient: boolean;
  reviewedByFreelancer: boolean;
}

export interface SubmitWorkPayload {
  submissionNote: string;
  submissionUrl: string;
}
