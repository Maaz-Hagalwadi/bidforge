package com.bidforge.app.login_activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginActivityRepository extends JpaRepository<LoginActivity, Long> {

    Page<LoginActivity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<LoginActivity> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
