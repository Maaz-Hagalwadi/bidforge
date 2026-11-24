package com.bidforge.job.job_invite;

import com.bidforge.job.job.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobInviteRepository extends JpaRepository<JobInvite, UUID> {

    List<JobInvite> findByFreelancerId(Long freelancerId);

    List<JobInvite> findByJob(Job job);

    List<JobInvite> findByJobOrderByInvitedAtDesc(Job job);

    List<JobInvite> findByFreelancerIdAndStatus(Long freelancerId, InviteStatus status);

    boolean existsByJobAndFreelancerId(Job job, Long freelancerId);

    @Query("SELECT i.job.id FROM JobInvite i WHERE i.freelancerId = :freelancerId")
    List<UUID> findJobIdsByFreelancerId(@Param("freelancerId") Long freelancerId);

    Optional<JobInvite> findByIdAndFreelancerId(UUID id, Long freelancerId);

    Optional<JobInvite> findByJobAndFreelancerId(Job job, Long freelancerId);
}
