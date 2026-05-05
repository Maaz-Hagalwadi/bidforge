package com.bidforge.app.review;

import com.bidforge.app.contract.Contract;
import com.bidforge.app.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByRevieweeOrderByCreatedAtDesc(User reviewee);

    List<Review> findByReviewerOrderByCreatedAtDesc(User reviewer);

    Optional<Review> findByContractAndReviewer(Contract contract, User reviewer);

    boolean existsByContractAndReviewer(Contract contract, User reviewer);

    boolean existsByContractIdAndReviewerId(UUID contractId, Long reviewerId);

    int countByReviewee(User reviewee);
}
