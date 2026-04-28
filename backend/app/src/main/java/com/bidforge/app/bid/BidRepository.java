package com.bidforge.app.bid;

import com.bidforge.app.job.Job;
import com.bidforge.app.job_invite.JobInvite;
import com.bidforge.app.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BidRepository extends JpaRepository<Bid, UUID> {

    boolean existsByJobAndFreelancer(Job job, User freelancer);

    List<Bid> findByJob(Job job);

    List<Bid> findByFreelancer(User freelancer);
}
