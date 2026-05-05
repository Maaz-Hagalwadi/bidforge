import api from './axiosInstance';
import type { ReviewResponse, CreateReviewRequest } from '@/types/review';

export const reviewsApi = {
  submitReview: (contractId: string, data: CreateReviewRequest) =>
    api.post<ReviewResponse>(`/contracts/${contractId}/review`, data).then(r => r.data),

  getMyReview: (contractId: string) =>
    api.get<ReviewResponse>(`/contracts/${contractId}/my-review`).then(r => r.data).catch(() => null),

  getUserReviews: (userId: number) =>
    api.get<ReviewResponse[]>(`/users/${userId}/reviews`).then(r => r.data),

  getReviewsGiven: (userId: number) =>
    api.get<ReviewResponse[]>(`/users/${userId}/reviews/given`).then(r => r.data),
};
