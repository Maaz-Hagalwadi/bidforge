package com.bidforge.app.review;

import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.common.exception.ContractNotFoundException;
import com.bidforge.app.contract.Contract;
import com.bidforge.app.contract.ContractRepository;
import com.bidforge.app.contract.ContractStatus;
import com.bidforge.app.notification.NotificationService;
import com.bidforge.app.notification.NotificationType;
import com.bidforge.app.review.dto.CreateReviewRequest;
import com.bidforge.app.review.dto.ReviewResponse;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ReviewResponse submitReview(UUID contractId, CreateReviewRequest req, User reviewer) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        if (contract.getStatus() != ContractStatus.COMPLETED) {
            throw new IllegalStateException("Reviews can only be submitted for completed contracts");
        }

        boolean isClient = contract.getClient().getId().equals(reviewer.getId());
        boolean isFreelancer = contract.getFreelancer().getId().equals(reviewer.getId());

        if (!isClient && !isFreelancer) {
            throw new AccessDeniedException("You are not a party to this contract");
        }

        if (reviewRepository.existsByContractAndReviewer(contract, reviewer)) {
            throw new IllegalStateException("You have already reviewed this contract");
        }

        User reviewee = isClient ? contract.getFreelancer() : contract.getClient();

        Review review = Review.builder()
                .contract(contract)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();

        reviewRepository.save(review);
        recalculateRating(reviewee);

        notificationService.createNotification(
                reviewee,
                "New Review Received",
                reviewer.getName() + " left you a " + req.getRating() + "-star review.",
                NotificationType.REVIEW_RECEIVED,
                contractId
        );

        return mapToResponse(review);
    }

    public List<ReviewResponse> getReviewsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return reviewRepository.findByRevieweeOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ReviewResponse> getReviewsGivenByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return reviewRepository.findByReviewerOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Optional<ReviewResponse> getMyReviewForContract(UUID contractId, User reviewer) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));
        return reviewRepository.findByContractAndReviewer(contract, reviewer)
                .map(this::mapToResponse);
    }

    private void recalculateRating(User reviewee) {
        List<Review> reviews = reviewRepository.findByRevieweeOrderByCreatedAtDesc(reviewee);
        if (reviews.isEmpty()) {
            reviewee.setRating(null);
        } else {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            reviewee.setRating(Math.round(avg * 10.0) / 10.0);
        }
        userRepository.save(reviewee);
    }

    private ReviewResponse mapToResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .contractId(r.getContract().getId())
                .jobTitle(r.getContract().getJob().getTitle())
                .reviewerId(r.getReviewer().getId())
                .reviewerName(r.getReviewer().getName())
                .revieweeId(r.getReviewee().getId())
                .revieweeName(r.getReviewee().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
