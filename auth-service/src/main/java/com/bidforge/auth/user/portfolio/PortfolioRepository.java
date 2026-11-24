package com.bidforge.auth.user.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioRepository extends JpaRepository<PortfolioItem, Long> {

    List<PortfolioItem> findByUserIdOrderByCreatedAtDesc(Long userId);
}
