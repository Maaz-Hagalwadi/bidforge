package com.bidforge.app.bid;

import com.bidforge.app.job.Job;
import com.bidforge.app.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BidRepository extends JpaRepository<Bid, UUID> {

    boolean existsByJobAndFreelancer(Job job, User freelancer);

    List<Bid> findByJob(Job job);

    Page<Bid> findByJobOrderByCreatedAtDesc(Job job, Pageable pageable);

    List<Bid> findByFreelancer(User freelancer);
}
