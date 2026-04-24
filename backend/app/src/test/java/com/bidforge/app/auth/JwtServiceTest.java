package com.bidforge.app.auth;

import com.bidforge.app.user.Role;
import com.bidforge.app.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;

    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
                "test-secret-key-for-testing-only-bidforge-xxxxxxxxxxxx");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900000L);

        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .role(Role.CLIENT)
                .name("Test User")
                .password("encoded")
                .build();
    }

    @Test
    void generateToken_returnsNonNullToken() {
        String token = jwtService.generateToken(testUser);
        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    void extractEmail_returnsCorrectEmail() {
        String token = jwtService.generateToken(testUser);
        assertThat(jwtService.extractEmail(token)).isEqualTo("test@example.com");
    }

    @Test
    void isTokenValid_returnsTrueForValidToken() {
        String token = jwtService.generateToken(testUser);
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForTamperedToken() {
        String token = jwtService.generateToken(testUser) + "tampered";
        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForExpiredToken() {
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L);
        String token = jwtService.generateToken(testUser);
        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void extractEmail_throwsForExpiredToken() {
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L);
        String token = jwtService.generateToken(testUser);
        assertThatThrownBy(() -> jwtService.extractEmail(token))
                .isInstanceOf(io.jsonwebtoken.JwtException.class);
    }
}
