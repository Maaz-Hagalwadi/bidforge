package com.bidforge.app.dispute;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DisputeRepository extends JpaRepository<Dispute, UUID> {
    List<Dispute> findByOpenedByIdOrderByCreatedAtDesc(Long userId);
    boolean existsByContractIdAndOpenedById(UUID contractId, Long userId);
    Page<Dispute> findByStatus(DisputeStatus status, Pageable pageable);
}
