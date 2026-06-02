package com.bidforge.app.login_activity;

import com.bidforge.app.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_activity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String country;

    @Column(name = "country_code", length = 5)
    private String countryCode;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "login_method", nullable = false, length = 20)
    private String loginMethod;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
