package com.bidforge.job.bid;

import com.bidforge.job.job.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BidRepository extends JpaRepository<Bid, UUID> {

    boolean existsByJobAndFreelancerId(Job job, Long freelancerId);

    List<Bid> findByJob(Job job);

    Page<Bid> findByJobOrderByCreatedAtDesc(Job job, Pageable pageable);

    List<Bid> findByFreelancerId(Long freelancerId);

    long countByStatus(BidStatus status);
}
