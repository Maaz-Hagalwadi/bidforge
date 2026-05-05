package com.bidforge.app.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, length = 20)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(length = 500)
    private String profileImageUrl;

    private String stripeAccountId;

    private Double rating;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 200)
    private String location;

    private Double hourlyRate;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(nullable = false)
    private boolean isOnline = false;

    private LocalDateTime lastSeen;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}