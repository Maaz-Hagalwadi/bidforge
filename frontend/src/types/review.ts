export interface ReviewResponse {
  id: string;
  contractId: string;
  jobTitle: string;
  reviewerId: number;
  reviewerName: string;
  revieweeId: number;
  revieweeName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}
