package com.bidforge.contract.contract;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {

    List<Contract> findByClientId(Long clientId);

    List<Contract> findByFreelancerId(Long freelancerId);

    boolean existsByJobId(UUID jobId);

    Optional<Contract> findByJobId(UUID jobId);

    long countByStatus(ContractStatus status);
}
