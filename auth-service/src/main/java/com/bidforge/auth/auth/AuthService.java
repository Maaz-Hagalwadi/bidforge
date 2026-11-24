package com.bidforge.auth.auth;

import com.bidforge.auth.auth.dto.RefreshTokenResult;
import com.bidforge.auth.auth.dto.request.*;
import com.bidforge.auth.auth.dto.response.LoginResponse;
import com.bidforge.auth.common.exception.*;
import com.bidforge.auth.email.EmailService;
import com.bidforge.auth.login_activity.LoginActivityService;
import com.bidforge.auth.user.Role;
import com.bidforge.auth.user.User;
import com.bidforge.auth.user.UserRepository;
import com.bidforge.auth.user.dto.response.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;
    private final LoginActivityService loginActivityService;

    private static final String PWD_RESET_PREFIX = "pwd_reset:";

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        userRepository.findByEmail(email)
                .ifPresent(u -> { throw new EmailAlreadyExistsException("Email already in use"); });
        if (request.getPhoneNumber() != null) {
            userRepository.findByPhoneNumber(request.getPhoneNumber())
                    .ifPresent(u -> { throw new PhoneAlreadyExistsException("Phone number already in use"); });
        }
        Role role = (request.getRole() != null && request.getRole() != Role.ADMIN) ? request.getRole() : Role.CLIENT;
        String verificationToken = UUID.randomUUID().toString();
        User user = User.builder()
                .name(request.getName()).email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber()).role(role)
                .emailVerified(false).emailVerificationToken(verificationToken)
                .build();
        User saved = userRepository.save(user);
        log.info("User registered: email={}, role={}", email, role);
        emailService.sendVerificationEmail(saved.getEmail(), saved.getName(), baseUrl + "/verify-email?token=" + verificationToken);
        return UserResponse.builder()
                .id(saved.getId()).name(saved.getName()).email(saved.getEmail())
                .phoneNumber(saved.getPhoneNumber()).role(saved.getRole()).rating(saved.getRating())
                .build();
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));
        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        if (!user.isEmailVerified()) throw new EmailNotVerifiedException("Please verify your email before logging in.");
        String refreshToken = refreshTokenService.createRefreshToken(user);
        emailService.sendLoginNotification(user.getEmail(), user.getName());
        loginActivityService.record(user, httpRequest, "EMAIL");
        return LoginResponse.builder()
                .message("Login successful").accessToken(jwtService.generateToken(user))
                .refreshToken(refreshToken).tokenType("Bearer").build();
    }

    public LoginResponse refresh(RefreshTokenRequest request) {
        RefreshTokenResult result = refreshTokenService.validateAndRotate(request.getRefreshToken());
        return LoginResponse.builder()
                .message("Token refreshed").accessToken(jwtService.generateToken(result.user()))
                .refreshToken(result.token()).tokenType("Bearer").build();
    }

    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revokeByToken(request.getRefreshToken());
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification link."));
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);
    }

    public void resendVerification(String email) {
        userRepository.findByEmail(email.toLowerCase().trim()).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                String token = UUID.randomUUID().toString();
                user.setEmailVerificationToken(token);
                userRepository.save(user);
                emailService.sendVerificationEmail(user.getEmail(), user.getName(), baseUrl + "/verify-email?token=" + token);
            }
        });
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail().toLowerCase().trim()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(PWD_RESET_PREFIX + token, String.valueOf(user.getId()), 15, TimeUnit.MINUTES);
            emailService.sendForgotPasswordEmail(user.getEmail(), user.getName(), baseUrl + "/reset-password?token=" + token);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        String userId = redisTemplate.opsForValue().get(PWD_RESET_PREFIX + request.getToken());
        if (userId == null) throw new IllegalArgumentException("Invalid or expired token");
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        redisTemplate.delete(PWD_RESET_PREFIX + request.getToken());
    }
}
