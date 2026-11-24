package com.bidforge.contract.review;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.review.dto.CreateReviewRequest;
import com.bidforge.contract.review.dto.ReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    private UserInfo getCurrentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/contracts/{contractId}")
    public ReviewResponse createReview(@PathVariable UUID contractId,
                                       @RequestBody CreateReviewRequest request) {
        return reviewService.createReview(contractId, request, getCurrentUser());
    }

    @GetMapping("/users/{userId}")
    public List<ReviewResponse> getReviewsForUser(@PathVariable Long userId) {
        return reviewService.getReviewsForUser(userId);
    }

    @GetMapping("/users/{userId}/given")
    public List<ReviewResponse> getReviewsGivenByUser(@PathVariable Long userId) {
        return reviewService.getReviewsGivenByUser(userId);
    }

    @GetMapping("/contracts/{contractId}/mine")
    public ResponseEntity<ReviewResponse> getMyReviewForContract(@PathVariable UUID contractId) {
        Optional<ReviewResponse> review = reviewService.getMyReviewForContract(contractId, getCurrentUser());
        return review.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
