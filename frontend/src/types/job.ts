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
