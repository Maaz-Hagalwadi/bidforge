package com.bidforge.app.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface JobInvitationRepository extends JpaRepository<JobInvitation, UUID> {

    boolean existsByJobIdAndFreelancerId(UUID jobId, Long freelancerId);

    @Query("SELECT i.job.id FROM JobInvitation i WHERE i.freelancer.id = :freelancerId")
    List<UUID> findJobIdsByFreelancerId(@Param("freelancerId") Long freelancerId);
}
