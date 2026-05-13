package com.bidforge.app.dispute;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DisputeRepository extends JpaRepository<Dispute, UUID> {
    List<Dispute> findByOpenedByIdOrderByCreatedAtDesc(Long userId);
    boolean existsByContractIdAndOpenedById(UUID contractId, Long userId);
    Page<Dispute> findByStatus(DisputeStatus status, Pageable pageable);

    @Query(value = "SELECT TO_CHAR(DATE_TRUNC('month', d.created_at), 'YYYY-MM') AS label, " +
                   "COALESCE(AVG(EXTRACT(EPOCH FROM (d.resolved_at - d.created_at)) / 3600), 0) AS value " +
                   "FROM dispute d WHERE d.resolved_at IS NOT NULL AND d.created_at >= :since " +
                   "GROUP BY label ORDER BY label", nativeQuery = true)
    List<Object[]> avgResolutionHoursByMonth(@Param("since") java.time.LocalDateTime since);
}
