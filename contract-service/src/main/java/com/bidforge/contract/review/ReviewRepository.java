package com.bidforge.contract.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByRevieweeId(Long id);

    List<Review> findByReviewerId(Long id);

    Optional<Review> findByContractIdAndReviewerId(UUID contractId, Long reviewerId);

    boolean existsByContractIdAndReviewerId(UUID contractId, Long reviewerId);
}
