package com.bidforge.app.job;

import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {
    List<Job> findByClient(User client);

    Page<Job> findByStatusAndVisibility(
            JobStatus status,
            Visibility visibility,
            Pageable pageable
    );
    Page<Job> findByStatusAndVisibilityAndCategoryContainingIgnoreCase(
            JobStatus status,
            Visibility visibility,
            String category,
            Pageable pageable
    );

    @Query("SELECT ji.job.id FROM JobInvite ji WHERE ji.freelancer.id = :freelancerId")
    List<UUID> findJobIdsByFreelancerId(Long freelancerId);
}