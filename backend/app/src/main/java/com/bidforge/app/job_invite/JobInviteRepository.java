package com.bidforge.app.job_invite;

import com.bidforge.app.job.Job;
import com.bidforge.app.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobInviteRepository extends JpaRepository<JobInvite, UUID> {

    List<JobInvite> findByFreelancer(User freelancer);

    List<JobInvite> findByFreelancerAndStatus(User freelancer, InviteStatus status);

    boolean existsByJobAndFreelancer(Job job, User freelancer);

    @Query("SELECT i.job.id FROM JobInvite i WHERE i.freelancer.id = :freelancerId")
    List<UUID> findJobIdsByFreelancerId(@Param("freelancerId") Long freelancerId);

    Optional<JobInvite> findByIdAndFreelancer(UUID id, User freelancer);

    Optional<JobInvite> findByJobAndFreelancer(Job job, User freelancer);
}
