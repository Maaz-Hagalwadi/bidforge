package com.bidforge.app.payment;

import com.bidforge.app.milestone.Milestone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByMilestone(Milestone milestone);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = com.bidforge.app.payment.PaymentStatus.RELEASED")
    double sumReleasedAmount();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = com.bidforge.app.payment.PaymentStatus.ESCROWED")
    double sumEscrowedAmount();

    @Query(value = "SELECT p FROM Payment p LEFT JOIN FETCH p.milestone m LEFT JOIN FETCH m.contract c LEFT JOIN FETCH c.client LEFT JOIN FETCH c.freelancer ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Payment p")
    Page<Payment> findAllWithDetails(Pageable pageable);

    @Query(value = "SELECT p FROM Payment p LEFT JOIN FETCH p.milestone m LEFT JOIN FETCH m.contract c LEFT JOIN FETCH c.client LEFT JOIN FETCH c.freelancer WHERE p.status = :status ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Payment p WHERE p.status = :status")
    Page<Payment> findAllWithDetailsByStatus(@Param("status") PaymentStatus status, Pageable pageable);

    @Query(value = "SELECT TO_CHAR(DATE_TRUNC('month', p.created_at), 'YYYY-MM') AS label, COALESCE(SUM(p.amount), 0) AS value " +
                   "FROM payment p WHERE p.status = 'RELEASED' AND p.created_at >= :since " +
                   "GROUP BY label ORDER BY label", nativeQuery = true)
    List<Object[]> revenueByMonth(@Param("since") java.time.LocalDateTime since);
}