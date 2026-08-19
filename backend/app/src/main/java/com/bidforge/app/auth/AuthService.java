package com.bidforge.app.auth;

import com.bidforge.app.auth.dto.RefreshTokenResult;
import com.bidforge.app.login_activity.LoginActivityService;
import com.bidforge.app.notification.EmailService;
import com.bidforge.app.notification.NotificationService;
import com.bidforge.app.notification.NotificationType;
import com.bidforge.app.auth.dto.request.ForgotPasswordRequest;
import com.bidforge.app.auth.dto.request.LoginRequest;
import com.bidforge.app.auth.dto.request.RefreshTokenRequest;
import com.bidforge.app.auth.dto.request.RegisterRequest;
import com.bidforge.app.auth.dto.request.ResetPasswordRequest;
import com.bidforge.app.auth.dto.response.LoginResponse;
import com.bidforge.app.common.exception.EmailAlreadyExistsException;
import com.bidforge.app.common.exception.EmailNotVerifiedException;
import com.bidforge.app.common.exception.InvalidCredentialsException;
import com.bidforge.app.common.exception.PhoneAlreadyExistsException;
import com.bidforge.app.user.Role;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import com.bidforge.app.user.dto.response.UserResponse;
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
    private final NotificationService notificationService;
    private final StringRedisTemplate redisTemplate;
    private final LoginActivityService loginActivityService;

    private static final String PWD_RESET_PREFIX = "pwd_reset:";

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        userRepository.findByEmail(email)
                .ifPresent(u -> { throw new EmailAlreadyExistsException("Email already in use"); });

        if (request.getPhoneNumber() != null) {
            userRepository.findByPhoneNumber(request.getPhoneNumber())
                    .ifPresent(u -> { throw new PhoneAlreadyExistsException("Phone number already in use"); });
        }

        Role role = (request.getRole() != null && request.getRole() != Role.ADMIN)
                ? request.getRole() : Role.CLIENT;

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(role)
                .emailVerified(false)
                .emailVerificationToken(verificationToken)
                .build();

        User saved = userRepository.save(user);
        log.info("User registered: email={}, role={}", email, role);
        String verifyUrl = baseUrl + "/verify-email?token=" + verificationToken;
        emailService.sendVerificationEmail(saved.getEmail(), saved.getName(), verifyUrl);
        userRepository.findByRole(Role.ADMIN).forEach(admin -> {
            notificationService.createNotification(admin,
                    "New User Registered",
                    saved.getName() + " (" + saved.getEmail() + ") signed up as " + saved.getRole() + ".",
                    NotificationType.NEW_USER_REGISTERED, null);
            emailService.sendNewUserRegisteredAdminEmail(admin.getEmail(), saved.getName(), saved.getEmail(), saved.getRole().name());
        });

        return UserResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .phoneNumber(saved.getPhoneNumber())
                .role(saved.getRole())
                .rating(saved.getRating())
                .build();
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            log.warn("Login blocked - email not verified: {}", email);
            throw new EmailNotVerifiedException("Please verify your email address before logging in.");
        }

        String refreshTokenValue = refreshTokenService.createRefreshToken(user);
        log.info("User logged in: email={}, role={}", email, user.getRole());
        emailService.sendLoginNotification(user.getEmail(), user.getName());
        loginActivityService.record(user, httpRequest, "EMAIL");

        return LoginResponse.builder()
                .message("Login successful")
                .accessToken(jwtService.generateToken(user))
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .build();
    }

    public LoginResponse refresh(RefreshTokenRequest request) {
        RefreshTokenResult result = refreshTokenService.validateAndRotate(request.getRefreshToken());

        return LoginResponse.builder()
                .message("Token refreshed")
                .accessToken(jwtService.generateToken(result.user()))
                .refreshToken(result.token())
                .tokenType("Bearer")
                .build();
    }

    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revokeByToken(request.getRefreshToken());
        log.info("User logged out");
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
                String verifyUrl = baseUrl + "/verify-email?token=" + token;
                emailService.sendVerificationEmail(user.getEmail(), user.getName(), verifyUrl);
            }
        });
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(PWD_RESET_PREFIX + token,
                    String.valueOf(user.getId()), 15, TimeUnit.MINUTES);
            log.info("Password reset requested: email={}", email);
            String resetUrl = baseUrl + "/reset-password?token=" + token;
            emailService.sendForgotPasswordEmail(user.getEmail(), user.getName(), resetUrl);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        String userId = redisTemplate.opsForValue().get(PWD_RESET_PREFIX + request.getToken());
        if (userId == null) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        redisTemplate.delete(PWD_RESET_PREFIX + request.getToken());
        log.info("Password reset completed: userId={}", user.getId());
    }
}
