export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface MilestoneResponse {
  id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
  status: MilestoneStatus;
  funded: boolean;
  contractId: string;
  jobTitle?: string;
  createdAt: string;
}

export interface CreateMilestoneRequest {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
}

export interface MilestoneSummary {
  total: number;
  funded: number;
  submitted: number;
  approved: number;
  totalAmount: number;
  releasedAmount: number;
}
