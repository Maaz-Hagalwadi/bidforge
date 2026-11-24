package com.bidforge.job.job;

import com.bidforge.job.job.enums.JobStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {

    List<Job> findByClientId(Long clientId);
    List<Job> findByClientIdOrderByCreatedAtDesc(Long clientId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT j FROM Job j WHERE j.id = :id")
    Optional<Job> findByIdWithLock(@Param("id") UUID id);

    long countByStatus(JobStatus status);

    Page<Job> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Job> findByStatusOrderByCreatedAtDesc(JobStatus status, Pageable pageable);
}
