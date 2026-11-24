package com.bidforge.auth.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByEmailVerificationToken(String token);
    Optional<User> findByPhoneNumber(String phoneNumber);
    List<User> findByRole(Role role);

    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name, String email, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(:q = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<User> searchByRoleAndQuery(@Param("role") Role role, @Param("q") String q, Pageable pageable);
}
