package com.bidforge.app.payment;

import com.bidforge.app.milestone.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByMilestone(Milestone milestone);
}