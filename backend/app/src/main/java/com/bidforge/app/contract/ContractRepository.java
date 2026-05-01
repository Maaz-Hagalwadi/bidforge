package com.bidforge.app.contract;

import com.bidforge.app.job.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {

    List<Contract> findByClientId(Long clientId);

    List<Contract> findByFreelancerId(Long freelancerId);

    boolean existsByJob(Job job);

    Optional<Contract> findByJob(Job job);
}
