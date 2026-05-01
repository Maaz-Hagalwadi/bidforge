import api from './axiosInstance';
import type { BidResponse, CreateBidPayload, CreateJobPayload, UpdateJobPayload, InviteWithJobResponse, JobInviteStatus, JobResponse, SpringPage } from '@/types/job';

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

  inviteFreelancers: (jobId: string, freelancerIds: number[]) =>
    api.post<string>(`/jobs/${jobId}/invite`, { freelancerIds }).then(r => r.data),

  getInvitedJobs: () =>
    api.get<JobResponse[]>('/jobs/invited').then(r => r.data),

  getInvites: () =>
    api.get<InviteWithJobResponse[]>('/jobs/invites').then(r => r.data),

  acceptInvite: (inviteId: string) =>
    api.post<string>(`/jobs/invites/${inviteId}/accept`).then(r => r.data),

  declineInvite: (inviteId: string) =>
    api.post<string>(`/jobs/invites/${inviteId}/decline`).then(r => r.data),

  getJobInvites: (jobId: string) =>
    api.get<JobInviteStatus[]>(`/jobs/${jobId}/invites`).then(r => r.data),

  getAllClientInvites: () =>
    api.get<JobInviteStatus[]>('/jobs/all-invites').then(r => r.data),

  getJobBids: (jobId: string) =>
    api.get<BidResponse[]>(`/jobs/${jobId}/bids`).then(r => r.data),

  createBid: (jobId: string, payload: CreateBidPayload) =>
    api.post<BidResponse>(`/jobs/${jobId}/bids`, payload).then(r => r.data),

  acceptBid: (bidId: string) =>
    api.post<string>(`/bids/${bidId}/accept`).then(r => r.data),

  declineBid: (bidId: string) =>
    api.post<string>(`/bids/${bidId}/decline`).then(r => r.data),

  getMyBids: () =>
    api.get<BidResponse[]>('/bids/my').then(r => r.data),

  updateJob: (id: string, payload: UpdateJobPayload) =>
    api.put<JobResponse>(`/jobs/${id}`, payload).then(r => r.data),

  archiveJob: (id: string) =>
    api.patch(`/jobs/${id}/archive`).then(r => r.data),
};
