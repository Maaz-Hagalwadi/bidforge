package com.bidforge.contract.milestone;

import com.bidforge.contract.contract.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {

    List<Milestone> findByContract(Contract contract);

    List<Milestone> findByContractClientId(Long clientId);

    List<Milestone> findByContractFreelancerId(Long freelancerId);
}
