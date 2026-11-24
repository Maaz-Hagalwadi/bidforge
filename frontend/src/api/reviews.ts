import api from './axiosInstance';
import type { ReviewResponse, CreateReviewRequest } from '@/types/review';

export const reviewsApi = {
  submitReview: (contractId: string, data: CreateReviewRequest) =>
    api.post<ReviewResponse>(`/reviews/contracts/${contractId}`, data).then(r => r.data),

  getMyReview: (contractId: string) =>
    api.get<ReviewResponse>(`/reviews/contracts/${contractId}/mine`).then(r => r.data).catch(() => null),

  getUserReviews: (userId: number) =>
    api.get<ReviewResponse[]>(`/reviews/users/${userId}`).then(r => r.data),

  getReviewsGiven: (userId: number) =>
    api.get<ReviewResponse[]>(`/reviews/users/${userId}/given`).then(r => r.data),
};
