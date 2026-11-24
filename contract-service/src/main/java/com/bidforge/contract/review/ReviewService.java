package com.bidforge.contract.review;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.common.exception.AccessDeniedException;
import com.bidforge.contract.common.exception.ContractNotFoundException;
import com.bidforge.contract.contract.Contract;
import com.bidforge.contract.contract.ContractRepository;
import com.bidforge.contract.contract.ContractStatus;
import com.bidforge.contract.review.dto.CreateReviewRequest;
import com.bidforge.contract.review.dto.ReviewResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ContractRepository contractRepository;

    @Transactional
    public ReviewResponse createReview(UUID contractId, CreateReviewRequest req, UserInfo reviewer) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        if (contract.getStatus() != ContractStatus.COMPLETED) {
            throw new IllegalStateException("Reviews can only be submitted for completed contracts");
        }

        boolean isClient = contract.getClientId().equals(reviewer.id());
        boolean isFreelancer = contract.getFreelancerId().equals(reviewer.id());

        if (!isClient && !isFreelancer) {
            throw new AccessDeniedException("You are not a party to this contract");
        }

        if (reviewRepository.existsByContractIdAndReviewerId(contractId, reviewer.id())) {
            throw new IllegalStateException("You have already submitted a review for this contract");
        }

        Long revieweeId;
        String revieweeName;
        if (isClient) {
            revieweeId = contract.getFreelancerId();
            revieweeName = contract.getFreelancerName();
        } else {
            revieweeId = contract.getClientId();
            revieweeName = contract.getClientName();
        }

        Review review = Review.builder()
                .contract(contract)
                .reviewerId(reviewer.id())
                .revieweeId(revieweeId)
                .reviewerName(reviewer.name())
                .revieweeName(revieweeName)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review submitted: reviewId={} contractId={} reviewerId={}", saved.getId(), contractId, reviewer.id());
        return mapToResponse(saved);
    }

    public List<ReviewResponse> getReviewsForUser(Long userId) {
        return reviewRepository.findByRevieweeId(userId)
                .stream().map(this::mapToResponse).toList();
    }

    public List<ReviewResponse> getReviewsGivenByUser(Long userId) {
        return reviewRepository.findByReviewerId(userId)
                .stream().map(this::mapToResponse).toList();
    }

    public Optional<ReviewResponse> getMyReviewForContract(UUID contractId, UserInfo user) {
        return reviewRepository.findByContractIdAndReviewerId(contractId, user.id())
                .map(this::mapToResponse);
    }

    public ReviewResponse mapToResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .contractId(r.getContract().getId())
                .contractJobTitle(r.getContract().getJobTitle())
                .reviewerId(r.getReviewerId())
                .revieweeId(r.getRevieweeId())
                .reviewerName(r.getReviewerName())
                .revieweeName(r.getRevieweeName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
