package com.bidforge.contract.payment;

import com.bidforge.contract.milestone.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByMilestone(Milestone milestone);
}
