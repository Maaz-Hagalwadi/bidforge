package com.bidforge.app.review;

import com.bidforge.app.review.dto.CreateReviewRequest;
import com.bidforge.app.review.dto.ReviewResponse;
import com.bidforge.app.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/contracts/{contractId}/review")
    public ResponseEntity<ReviewResponse> submitReview(
            @PathVariable UUID contractId,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        ReviewResponse response = reviewService.submitReview(contractId, request, getCurrentUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/contracts/{contractId}/my-review")
    public ResponseEntity<ReviewResponse> getMyReview(@PathVariable UUID contractId) {
        return reviewService.getMyReviewForContract(contractId, getCurrentUser())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/users/{userId}/reviews")
    public List<ReviewResponse> getUserReviews(@PathVariable Long userId) {
        return reviewService.getReviewsForUser(userId);
    }

    @GetMapping("/users/{userId}/reviews/given")
    public List<ReviewResponse> getUserReviewsGiven(@PathVariable Long userId) {
        return reviewService.getReviewsGivenByUser(userId);
    }
}
