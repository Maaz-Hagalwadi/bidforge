export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface DisputeResponse {
  id: string;
  contractId: string;
  jobTitle: string;
  openedById: number;
  openedByName: string;
  reason: string;
  status: DisputeStatus;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface OpenDisputePayload {
  reason: string;
}
