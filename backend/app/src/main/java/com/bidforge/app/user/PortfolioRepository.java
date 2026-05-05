package com.bidforge.app.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PortfolioRepository extends JpaRepository<PortfolioItem, UUID> {
    List<PortfolioItem> findByUserIdOrderByCreatedAtDesc(Long userId);
}