package com.bidforge.contract.dispute;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    List<Dispute> findByRaisedById(Long id);

    List<Dispute> findByContractClientIdOrContractFreelancerId(Long clientId, Long freelancerId);

    Page<Dispute> findAll(Pageable pageable);
}
