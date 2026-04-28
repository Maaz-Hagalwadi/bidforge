import api from './axiosInstance';
import type { CreateJobPayload, InviteWithJobResponse, JobResponse, SpringPage } from '@/types/job';

export const jobsApi = {
  create: (payload: CreateJobPayload) =>
    api.post<JobResponse>('/jobs', payload).then(r => r.data),

  getAll: (params?: Record<string, string | number | undefined>) =>
    api.get<SpringPage<JobResponse>>('/jobs', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<JobResponse>(`/jobs/${id}`).then(r => r.data),

  getMyJobs: () =>
    api.get<JobResponse[]>('/jobs/my').then(r => r.data),

  inviteFreelancer: (jobId: string, freelancerId: number) =>
    api.post(`/jobs/${jobId}/invite/${freelancerId}`).then(r => r.data),

  getInvitedJobs: () =>
    api.get<JobResponse[]>('/jobs/invited').then(r => r.data),

  getInvites: () =>
    api.get<InviteWithJobResponse[]>('/jobs/invites').then(r => r.data),

  acceptInvite: (inviteId: string) =>
    api.post<string>(`/jobs/invites/${inviteId}/accept`).then(r => r.data),

  declineInvite: (inviteId: string) =>
    api.post<string>(`/jobs/invites/${inviteId}/decline`).then(r => r.data),
};
