export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface CreateJobPayload {
  title: string;
  category: string;
  description: string;
  requiredSkills?: string;
  budgetType: 'FIXED' | 'HOURLY';
  budgetMin: number;
  budgetMax: number;
  deadline?: string;
  attachmentUrl?: string;
  visibility: 'PUBLIC' | 'INVITE_ONLY';
  draft: boolean;
}

export type InviteStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED';

export interface JobInviteStatus {
  inviteId: string;
  jobId: string;
  jobTitle: string;
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
  status: InviteStatus;
  invitedAt: string;
}

export interface InviteWithJobResponse {
  inviteId: string;
  inviteStatus: InviteStatus;
  jobId: string;
  title: string;
  category: string;
  description: string;
  requiredSkills?: string;
  budgetType: 'FIXED' | 'HOURLY';
  budgetMin: number;
  budgetMax: number;
  deadline?: string;
  attachmentUrl?: string;
  visibility: 'PUBLIC' | 'INVITE_ONLY';
  status: 'DRAFT' | 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  clientId: number;
  createdAt: string;
  updatedAt: string;
}

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface BidResponse {
  id: string;
  amount: number;
  proposal: string;
  deliveryDays: number;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  freelancerId: number;
  freelancerName: string;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBidPayload {
  amount: number;
  proposal: string;
  deliveryDays: number;
}

export interface JobResponse {
  id: string;
  title: string;
  category: string;
  description: string;
  requiredSkills?: string;
  budgetType: 'FIXED' | 'HOURLY';
  budgetMin: number;
  budgetMax: number;
  deadline?: string;
  attachmentUrl?: string;
  visibility: 'PUBLIC' | 'INVITE_ONLY';
  status: 'DRAFT' | 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  clientId: number;
  createdAt: string;
  updatedAt: string;
}
