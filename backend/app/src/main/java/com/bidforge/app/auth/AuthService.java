package com.bidforge.app.auth;

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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

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

    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException("Please verify your email address before logging in.");
        }

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        emailService.sendLoginNotification(user.getEmail(), user.getName());

        return LoginResponse.builder()
                .message("Login successful")
                .accessToken(jwtService.generateToken(user))
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .build();
    }

    public LoginResponse refresh(RefreshTokenRequest request) {
        RefreshToken newRefreshToken = refreshTokenService.validateAndRotate(request.getRefreshToken());
        User user = newRefreshToken.getUser();

        return LoginResponse.builder()
                .message("Token refreshed")
                .accessToken(jwtService.generateToken(user))
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .build();
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
                String verifyUrl = baseUrl + "/verify-email?token=" + token;
                emailService.sendVerificationEmail(user.getEmail(), user.getName(), verifyUrl);
            }
        });
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .user(user)
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);
            String resetUrl = baseUrl + "/reset-password?token=" + token;
            emailService.sendForgotPasswordEmail(user.getEmail(), user.getName(), resetUrl);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Token already used");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }
}
