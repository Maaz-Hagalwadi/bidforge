import api from './axiosInstance';

export interface GenerateDescriptionResponse {
  description: string;
  skills: string[];
}

export interface GenerateProposalResponse {
  proposal: string;
}

export interface MilestoneSuggestion {
  title: string;
  description: string;
  amount: number;
  dueDays: number;
}

export interface SuggestMilestonesResponse {
  milestones: MilestoneSuggestion[];
}

export interface JobRecommendation {
  jobId: string;
  title: string;
  matchScore: number;
  matchReason: string;
  budgetMin?: number;
  budgetMax?: number;
  category?: string;
  requiredSkills?: string;
}

export interface ProfileSuggestions {
  bioRewrite: string;
  titleSuggestion: string;
  skillsToAdd: string[];
  overallScore: number;
  feedback: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export const aiApi = {
  generateDescription: (payload: { title: string; notes: string; category: string }) =>
    api.post<GenerateDescriptionResponse>('/ai/generate-description', payload).then(r => r.data),

  generateProposal: (payload: { jobTitle: string; jobDescription: string; requiredSkills?: string }) =>
    api.post<GenerateProposalResponse>('/ai/generate-proposal', payload).then(r => r.data),

  suggestMilestones: (payload: { jobTitle: string; jobDescription: string; totalAmount: number; deliveryDays: number }) =>
    api.post<SuggestMilestonesResponse>('/ai/suggest-milestones', payload).then(r => r.data),

  getJobRecommendations: () =>
    api.get<JobRecommendation[]>('/ai/job-recommendations').then(r => r.data),

  optimizeProfile: () =>
    api.post<ProfileSuggestions>('/ai/optimize-profile').then(r => r.data),

  chat: (message: string, history: ChatMessage[]) =>
    api.post<ChatResponse>('/ai/chat', { message, history }).then(r => r.data),
};
