package com.bidforge.app.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByEmailVerificationToken(String token);

    Optional<User> findByPhoneNumber(String phoneNumber);

    List<User> findByRole(Role role);

    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(:q = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "(u.title IS NOT NULL AND LOWER(u.title) LIKE LOWER(CONCAT('%', :q, '%'))) OR " +
           "(u.skills IS NOT NULL AND LOWER(u.skills) LIKE LOWER(CONCAT('%', :q, '%'))))")
    List<User> searchByRoleAndQuery(@Param("role") Role role, @Param("q") String q, Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.isOnline = :status, u.lastSeen = :lastSeen WHERE u.id = :userId")
    void updateOnlineStatus(@Param("userId") Long userId, @Param("status") boolean status, @Param("lastSeen") LocalDateTime lastSeen);

    long countByRole(Role role);

    long countByBanned(boolean banned);

    long countByEmailVerifiedFalseAndBannedFalse();

    // Consolidated admin query: supports role, search, and status (ALL/VERIFIED/PENDING/FLAGGED) filters
    @Query("SELECT u FROM User u WHERE " +
           "(:roleParam IS NULL OR u.role = :roleParam) AND " +
           "(:q = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
           "(:status = 'ALL' OR " +
           "  (:status = 'FLAGGED'  AND u.banned = TRUE) OR " +
           "  (:status = 'PENDING'  AND u.banned = FALSE AND u.emailVerified = FALSE) OR " +
           "  (:status = 'VERIFIED' AND u.banned = FALSE AND u.emailVerified = TRUE)) " +
           "ORDER BY u.createdAt DESC")
    Page<User> findAllForAdmin(
            @Param("roleParam") Role roleParam,
            @Param("q") String q,
            @Param("status") String status,
            Pageable pageable);
}
